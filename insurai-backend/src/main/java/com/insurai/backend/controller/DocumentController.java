package com.insurai.backend.controller;

import java.io.IOException;
import java.net.URI;
import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.Paths;
import java.util.List;
import java.util.Map;
import java.util.Optional;

import org.springframework.core.io.FileSystemResource;
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

            if (storagePath.startsWith("http")) {
                System.out.println("[DEBUG] Cloudinary URL detected, redirecting");
                return ResponseEntity.status(HttpStatus.FOUND)
                        .location(URI.create(storagePath))
                        .build();
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
            
            if (storagePath.startsWith("http")) {
                System.out.println("[DEBUG] Cloudinary URL detected, redirecting");
                return ResponseEntity.status(HttpStatus.FOUND)
                        .location(URI.create(storagePath))
                        .header(HttpHeaders.CONTENT_DISPOSITION, "attachment; filename=\"" + document.getFileName() + "\"")
                        .build();
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