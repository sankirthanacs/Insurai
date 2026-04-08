package com.insurai.backend.controller;

import java.io.IOException;
import java.io.InputStream;
import java.net.URI;
import java.net.URL;
import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.Paths;
import java.util.List;
import java.util.Map;
import java.util.Optional;

import org.springframework.core.io.FileSystemResource;
import org.springframework.core.io.InputStreamResource;
import org.springframework.core.io.Resource;
import org.springframework.http.HttpHeaders;
import org.springframework.http.HttpStatus;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.web.multipart.MultipartFile;

import com.cloudinary.Cloudinary;
import com.cloudinary.utils.ObjectUtils;
import com.insurai.backend.entity.Document;
import com.insurai.backend.repository.DocumentRepository;
import com.insurai.backend.service.DocumentService;

@RestController
@RequestMapping("/api/documents")
public class DocumentController {

    private final DocumentRepository documentRepository;
    private final DocumentService documentService;
    private final Cloudinary cloudinary;

    public DocumentController(DocumentRepository documentRepository, DocumentService documentService) {
        this.documentRepository = documentRepository;
        this.documentService = documentService;
        
        // Initialize Cloudinary from environment variables
        Cloudinary tempCloudinary = null;
        try {
            // Cloudinary will read from environment variables:
            // CLOUDINARY_URL or CLOUDINARY_CLOUD_NAME, CLOUDINARY_API_KEY, CLOUDINARY_API_SECRET
            java.util.Map<String, String> config = new java.util.HashMap<>();
            String cloudName = System.getenv("CLOUDINARY_CLOUD_NAME");
            String apiKey = System.getenv("CLOUDINARY_API_KEY");
            String apiSecret = System.getenv("CLOUDINARY_API_SECRET");
            
            if (cloudName != null && !cloudName.isEmpty() && 
                apiKey != null && !apiKey.isEmpty() && 
                apiSecret != null && !apiSecret.isEmpty()) {
                config.put("cloud_name", cloudName);
                config.put("api_key", apiKey);
                config.put("api_secret", apiSecret);
                tempCloudinary = new Cloudinary(config);
                System.out.println("[DEBUG] Cloudinary initialized with credentials from environment");
            } else {
                System.out.println("[DEBUG] Cloudinary credentials not found in environment variables");
            }
        } catch (Exception e) {
            System.out.println("[DEBUG] Error initializing Cloudinary: " + e.getMessage());
        }
        this.cloudinary = tempCloudinary;
    }

    @GetMapping("/test")
    public ResponseEntity<?> testEndpoint() {
        long count = documentRepository.count();
        List<Document> allDocs = documentRepository.findAll();
        return ResponseEntity.ok(Map.of("count", count, "documents", allDocs.stream().map(d -> 
            Map.of("id", d.getId(), "fileName", d.getFileName(), "storagePath", d.getStoragePath(), 
                "contentType", d.getContentType() != null ? d.getContentType() : "application/octet-stream",
                "size", d.getSize() != null ? d.getSize() : 0,
                "userId", d.getUserId() != null ? d.getUserId() : 0,
                "userEmail", d.getUserEmail() != null ? d.getUserEmail() : "",
                "documentType", d.getDocumentType() != null ? d.getDocumentType() : "GENERAL",
                "uploadedAt", d.getUploadedAt() != null ? d.getUploadedAt().toString() : "")
        ).toList()));
    }

    @GetMapping("/info/{id}")
    public ResponseEntity<?> getDocumentInfo(@PathVariable Long id) {
        Optional<Document> doc = documentRepository.findById(id);
        if (doc.isEmpty()) {
            return ResponseEntity.notFound().build();
        }
        Document d = doc.get();
        return ResponseEntity.ok(Map.of(
            "id", d.getId(),
            "fileName", d.getFileName(),
            "storagePath", d.getStoragePath(),
            "contentType", d.getContentType(),
            "size", d.getSize(),
            "userId", d.getUserId()
        ));
    }

    @PostMapping("/upload")
    public ResponseEntity<?> uploadDocument(
            @RequestParam("files") MultipartFile[] files,
            Authentication authentication) {
        
        if (authentication == null || !authentication.isAuthenticated()) {
            return ResponseEntity.status(401).body("Unauthorized");
        }
        
        try {
            String userEmail = authentication.getName();
            List<Document> documents = documentService.saveDocuments(java.util.Arrays.asList(files), userEmail);
            return ResponseEntity.ok(documents);
        } catch (IOException e) {
            return ResponseEntity.status(500).body("Failed to upload documents: " + e.getMessage());
        } catch (RuntimeException e) {
            return ResponseEntity.status(400).body(e.getMessage());
        }
    }

    @GetMapping("/user")
    public ResponseEntity<?> getUserDocuments(Authentication authentication) {
        if (authentication == null || !authentication.isAuthenticated()) {
            return ResponseEntity.status(401).body("Unauthorized");
        }
        
        try {
            String userEmail = authentication.getName();
            List<Document> documents = documentService.getUserDocuments(userEmail);
            return ResponseEntity.ok(documents);
        } catch (RuntimeException e) {
            return ResponseEntity.status(400).body(e.getMessage());
        }
    }

    @GetMapping("/{id}/view")
    public ResponseEntity<?> viewDocument(@PathVariable Long id) {
        System.out.println("[DEBUG] viewDocument called with id: " + id);
        try {
            Optional<Document> docOpt = documentRepository.findById(id);
            System.out.println("[DEBUG] Document found: " + docOpt.isPresent());
            
            if (docOpt.isEmpty()) {
                System.out.println("[DEBUG] Document not found in DB for id: " + id);
                return ResponseEntity.notFound().build();
            }
            
            Document document = docOpt.get();
            String storagePath = document.getStoragePath();
            System.out.println("[DEBUG] Document storagePath: " + storagePath);

            // Proxy Cloudinary requests instead of redirecting to avoid CORS issues
            if (storagePath.startsWith("http")) {
                System.out.println("[DEBUG] Cloudinary URL detected, proxying request");
                return proxyCloudinaryDocument(storagePath, document, false);
            }

            Path filePath = Paths.get(storagePath);
            System.out.println("[DEBUG] Full file path: " + filePath.toAbsolutePath());
            
            Resource resource = new FileSystemResource(filePath);
            System.out.println("[DEBUG] Resource exists: " + resource.exists());

            if (!resource.exists()) {
                return ResponseEntity.notFound().build();
            }

            String contentType = document.getContentType();
            if (contentType == null) {
                contentType = "application/octet-stream";
            }

            return ResponseEntity.ok()
                    .contentType(MediaType.parseMediaType(contentType))
                    .header(HttpHeaders.CONTENT_DISPOSITION, "inline; filename=\"" + document.getFileName() + "\"")
                    .body(resource);
        } catch (Exception e) {
            System.out.println("[DEBUG] Error in viewDocument: " + e.getMessage());
            e.printStackTrace();
            return ResponseEntity.status(500).build();
        }
    }

    /**
     * Proxy a document from Cloudinary to avoid CORS issues when embedding in iframes.
     * This method fetches the document from Cloudinary server-side and streams it to the client.
     * Uses Cloudinary SDK for proper authentication with private resources.
     */
    private ResponseEntity<?> proxyCloudinaryDocument(String cloudinaryUrl, Document document, boolean download) {
        System.out.println("[DEBUG] Proxying Cloudinary URL: " + cloudinaryUrl);
        System.out.println("[DEBUG] Document filename: " + document.getFileName());
        System.out.println("[DEBUG] Document contentType: " + document.getContentType());
        
        java.io.ByteArrayOutputStream buffer = null;
        try {
            // Extract public_id from Cloudinary URL
            // URL format: https://res.cloudinary.com/{cloud_name}/image/upload/v{version}/{public_id}.{ext}
            String publicId = extractPublicIdFromUrl(cloudinaryUrl);
            System.out.println("[DEBUG] Extracted public ID: " + publicId);
            
            // If cloudinary is initialized, use the SDK's download method for authenticated access
            if (cloudinary != null && publicId != null) {
                System.out.println("[DEBUG] Using Cloudinary SDK for authenticated download");
                try {
                    // Generate a signed download URL with a short expiry
                    String signedUrl = cloudinary.url()
                            .signed(true)
                            .generate(publicId);
                    System.out.println("[DEBUG] Generated signed URL: " + signedUrl);
                    
                    URL url = new URL(signedUrl);
                    java.net.HttpURLConnection connection = (java.net.HttpURLConnection) url.openConnection();
                    connection.setRequestMethod("GET");
                    connection.setConnectTimeout(15000);
                    connection.setReadTimeout(30000);
                    
                    int responseCode = connection.getResponseCode();
                    System.out.println("[DEBUG] Cloudinary signed URL response code: " + responseCode);
                    
                    if (responseCode == java.net.HttpURLConnection.HTTP_OK) {
                        String contentType = connection.getContentType();
                        System.out.println("[DEBUG] Response content type: " + contentType);
                        
                        if (contentType == null || contentType.isEmpty()) {
                            contentType = document.getContentType();
                        }
                        if (contentType == null) {
                            contentType = "application/octet-stream";
                        }
                        
                        // Read the entire content into a byte array
                        InputStream inputStream = connection.getInputStream();
                        buffer = new java.io.ByteArrayOutputStream();
                        byte[] chunk = new byte[4096];
                        int bytesRead;
                        while ((bytesRead = inputStream.read(chunk)) != -1) {
                            buffer.write(chunk, 0, bytesRead);
                        }
                        System.out.println("[DEBUG] Successfully read " + buffer.size() + " bytes from Cloudinary");
                        
                        byte[] content = buffer.toByteArray();
                        InputStreamResource resource = new InputStreamResource(new java.io.ByteArrayInputStream(content));
                        
                        return ResponseEntity.ok()
                                .contentType(MediaType.parseMediaType(contentType))
                                .header(HttpHeaders.CONTENT_DISPOSITION, download ? 
                                        "attachment; filename=\"" + document.getFileName() + "\"" : 
                                        "inline; filename=\"" + document.getFileName() + "\"")
                                .header(HttpHeaders.CONTENT_LENGTH, String.valueOf(content.length))
                                .header(HttpHeaders.CACHE_CONTROL, "public, max-age=3600")
                                .body(resource);
                    } else {
                        System.out.println("[DEBUG] Signed URL fetch failed with code: " + responseCode);
                        // Fall through to try unsigned access
                    }
                } catch (Exception e) {
                    System.out.println("[DEBUG] Error using Cloudinary SDK: " + e.getMessage());
                    // Fall through to try direct access
                }
            }
            
            // Fallback: Try direct access with proper headers
            System.out.println("[DEBUG] Trying direct Cloudinary access...");
            URL url = new URL(cloudinaryUrl);
            java.net.HttpURLConnection connection = (java.net.HttpURLConnection) url.openConnection();
            connection.setRequestMethod("GET");
            connection.setConnectTimeout(15000);
            connection.setReadTimeout(30000);
            connection.setRequestProperty("User-Agent", "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36");
            connection.setRequestProperty("Accept", "*/*");
            
            System.out.println("[DEBUG] Connecting to Cloudinary...");
            int responseCode = connection.getResponseCode();
            System.out.println("[DEBUG] Cloudinary response code: " + responseCode);
            
            if (responseCode != java.net.HttpURLConnection.HTTP_OK) {
                System.out.println("[DEBUG] Failed to fetch from Cloudinary: " + responseCode);
                System.out.println("[DEBUG] Response message: " + connection.getResponseMessage());
                
                // Try to read error stream for more details
                try {
                    java.io.InputStream errorStream = connection.getErrorStream();
                    if (errorStream != null) {
                        java.util.Scanner scanner = new java.util.Scanner(errorStream).useDelimiter("\\A");
                        String errorBody = scanner.hasNext() ? scanner.next() : "";
                        System.out.println("[DEBUG] Error body: " + errorBody);
                    }
                } catch (Exception e) {
                    // Ignore error stream reading errors
                }
                
                return ResponseEntity.status(HttpStatus.BAD_GATEWAY)
                        .body("Failed to fetch document from storage (HTTP " + responseCode + "). Please ensure Cloudinary credentials are configured.");
            }
            
            String contentType = connection.getContentType();
            System.out.println("[DEBUG] Response content type: " + contentType);
            
            if (contentType == null || contentType.isEmpty()) {
                contentType = document.getContentType();
            }
            if (contentType == null) {
                contentType = "application/octet-stream";
            }
            
            // Read the entire content into a byte array
            InputStream inputStream = connection.getInputStream();
            buffer = new java.io.ByteArrayOutputStream();
            byte[] chunk = new byte[4096];
            int bytesRead;
            while ((bytesRead = inputStream.read(chunk)) != -1) {
                buffer.write(chunk, 0, bytesRead);
            }
            System.out.println("[DEBUG] Successfully read " + buffer.size() + " bytes from Cloudinary");
            
            // Create resource from byte array
            byte[] content = buffer.toByteArray();
            InputStreamResource resource = new InputStreamResource(new java.io.ByteArrayInputStream(content));
            
            return ResponseEntity.ok()
                    .contentType(MediaType.parseMediaType(contentType))
                    .header(HttpHeaders.CONTENT_DISPOSITION, download ? 
                            "attachment; filename=\"" + document.getFileName() + "\"" : 
                            "inline; filename=\"" + document.getFileName() + "\"")
                    .header(HttpHeaders.CONTENT_LENGTH, String.valueOf(content.length))
                    .header(HttpHeaders.CACHE_CONTROL, "public, max-age=3600")
                    .body(resource);
        } catch (Exception e) {
            System.out.println("[DEBUG] Error proxying Cloudinary document: " + e.getMessage());
            e.printStackTrace();
            return ResponseEntity.status(HttpStatus.BAD_GATEWAY).body("Failed to fetch document: " + e.getMessage());
        } finally {
            if (buffer != null) {
                try { buffer.close(); } catch (IOException e) { /* ignore */ }
            }
        }
    }

    /**
     * Extract the public_id from a Cloudinary URL.
     * URL format: https://res.cloudinary.com/{cloud_name}/image/upload/v{version}/{path}/{filename}.{ext}
     * Returns the public_id without the version prefix (e.g., "documents/78774aec-bf5d-40bb-becf-31db1e342ba4")
     */
    private String extractPublicIdFromUrl(String cloudinaryUrl) {
        try {
            // Parse the URL to extract the path after /upload/
            java.net.URL url = new URL(cloudinaryUrl);
            String path = url.getPath();
            System.out.println("[DEBUG] URL path: " + path);
            
            // Find the /upload/ segment and extract everything after the version
            int uploadIndex = path.indexOf("/upload/");
            if (uploadIndex == -1) {
                System.out.println("[DEBUG] No /upload/ segment found in path");
                return null;
            }
            
            // Get the part after /upload/
            String afterUpload = path.substring(uploadIndex + "/upload/".length());
            System.out.println("[DEBUG] After upload: " + afterUpload);
            
            // Skip the version part (e.g., "v1775653281/")
            int firstSlash = afterUpload.indexOf('/');
            if (firstSlash == -1) {
                return afterUpload;
            }
            
            // Get everything after the version
            String publicId = afterUpload.substring(firstSlash + 1);
            System.out.println("[DEBUG] Extracted public ID: " + publicId);
            
            return publicId;
        } catch (Exception e) {
            System.out.println("[DEBUG] Error extracting public ID: " + e.getMessage());
            return null;
        }
    }

    @GetMapping("/{id}/download")
    public ResponseEntity<?> downloadDocument(@PathVariable Long id) {
        System.out.println("[DEBUG] downloadDocument called with id: " + id);
        try {
            Optional<Document> docOpt = documentRepository.findById(id);
            System.out.println("[DEBUG] Document found: " + docOpt.isPresent());
            
            if (docOpt.isEmpty()) {
                return ResponseEntity.notFound().build();
            }
            
            Document document = docOpt.get();
            String storagePath = document.getStoragePath();
            
            // Proxy Cloudinary requests instead of redirecting to avoid CORS issues
            if (storagePath.startsWith("http")) {
                System.out.println("[DEBUG] Cloudinary URL detected, proxying request");
                return proxyCloudinaryDocument(storagePath, document, true);
            }

            Path filePath = Paths.get(storagePath);
            Resource resource = new FileSystemResource(filePath);

            if (!resource.exists()) {
                return ResponseEntity.notFound().build();
            }

            String contentType = document.getContentType();
            if (contentType == null) {
                contentType = "application/octet-stream";
            }

            return ResponseEntity.ok()
                    .contentType(MediaType.parseMediaType(contentType))
                    .header(HttpHeaders.CONTENT_DISPOSITION, "attachment; filename=\"" + document.getFileName() + "\"")
                    .body(resource);
        } catch (Exception e) {
            System.out.println("[DEBUG] Error in downloadDocument: " + e.getMessage());
            return ResponseEntity.status(500).build();
        }
    }
}