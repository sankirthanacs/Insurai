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

import com.insurai.backend.entity.Document;
import com.insurai.backend.repository.DocumentRepository;
import com.insurai.backend.service.DocumentService;

@RestController
@RequestMapping("/api/documents")
public class DocumentController {

    private final DocumentRepository documentRepository;
    private final DocumentService documentService;

    public DocumentController(DocumentRepository documentRepository, DocumentService documentService) {
        this.documentRepository = documentRepository;
        this.documentService = documentService;
    }

    @GetMapping("/test")
    public ResponseEntity<?> testEndpoint() {
        long count = documentRepository.count();
        List<Document> allDocs = documentRepository.findAll();
        return ResponseEntity.ok(Map.of("count", count, "documents", allDocs.stream().map(d -> 
            Map.of("id", d.getId(), "fileName", d.getFileName(), "storagePath", d.getStoragePath())
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
     */
    private ResponseEntity<?> proxyCloudinaryDocument(String cloudinaryUrl, Document document, boolean download) {
        System.out.println("[DEBUG] Proxying Cloudinary URL: " + cloudinaryUrl);
        System.out.println("[DEBUG] Document filename: " + document.getFileName());
        System.out.println("[DEBUG] Document contentType: " + document.getContentType());
        
        java.io.ByteArrayOutputStream buffer = null;
        try {
            URL url = new URL(cloudinaryUrl);
            java.net.HttpURLConnection connection = (java.net.HttpURLConnection) url.openConnection();
            connection.setRequestMethod("GET");
            connection.setConnectTimeout(15000);
            connection.setReadTimeout(30000);
            connection.setRequestProperty("User-Agent", "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36");
            
            System.out.println("[DEBUG] Connecting to Cloudinary...");
            int responseCode = connection.getResponseCode();
            System.out.println("[DEBUG] Cloudinary response code: " + responseCode);
            
            // If the resource is not found or access is forbidden, try to provide a helpful error
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
                        .body("Failed to fetch document from storage (HTTP " + responseCode + ")");
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
                    .header(HttpHeaders.CACHE_CONTROL, "public, max-age=31536000")
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