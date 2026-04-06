package com.insurai.backend.service;

import java.io.IOException;
import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.Paths;
import java.time.LocalDateTime;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.UUID;
import java.util.stream.Collectors;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.core.io.ByteArrayResource;
import org.springframework.core.io.Resource;
import org.springframework.stereotype.Service;
import org.springframework.web.multipart.MultipartFile;

import com.cloudinary.Cloudinary;
import com.cloudinary.utils.ObjectUtils;
import com.insurai.backend.DashboardWebSocketHandler;
import com.insurai.backend.entity.Document;
import com.insurai.backend.entity.Notification;
import com.insurai.backend.entity.User;
import com.insurai.backend.repository.DocumentRepository;
import com.insurai.backend.repository.UserRepository;

import jakarta.annotation.PostConstruct;

@Service
public class DocumentService {

    @Value("${insurai.upload-dir:uploads}")
    private String uploadDir;

    @Autowired
    private DocumentRepository documentRepository;

    @Autowired
    private UserRepository userRepository;

    @Autowired
    private DashboardWebSocketHandler dashboardWebSocketHandler;

    @Autowired
    private NotificationService notificationService;

    @Autowired(required = false)
    private Cloudinary cloudinary;

    private boolean useCloudinary = false;

    @PostConstruct
    public void init() {
        if (cloudinary != null) {
            useCloudinary = true;
            System.out.println("[DocumentService] Cloudinary is configured and enabled");
        } else {
            useCloudinary = false;
            System.out.println("[DocumentService] Cloudinary not configured, using local storage");
            try {
                Files.createDirectories(Paths.get(uploadDir));
            } catch (IOException e) {
                throw new RuntimeException("Could not initialize upload directory", e);
            }
        }
    }

    public List<Document> getUserDocuments(String userEmail) {
        User user = userRepository.findByEmail(userEmail)
                .orElseThrow(() -> new RuntimeException("User not found"));
        return documentRepository.findByUserIdOrderByUploadedAtDesc(user.getId());
    }

    public Document saveDocument(MultipartFile file, String userEmail) throws IOException {
        User user = userRepository.findByEmail(userEmail)
                .orElseThrow(() -> new RuntimeException("User not found"));

        String originalFilename = file.getOriginalFilename() == null ? "file" : file.getOriginalFilename();
        String extension = "";
        int dot = originalFilename.lastIndexOf('.');
        if (dot >= 0) {
            extension = originalFilename.substring(dot);
        }

        Document document = new Document();
        document.setUserId(user.getId());
        document.setFileName(originalFilename);
        document.setContentType(file.getContentType() == null ? "application/octet-stream" : file.getContentType());
        document.setSize(file.getSize());

        if (useCloudinary && cloudinary != null) {
            String publicId = "documents/" + UUID.randomUUID().toString();
            
            Map<String, Object> params = ObjectUtils.asMap(
                "public_id", publicId,
                "resource_type", "auto",
                "folder", "insurai/documents"
            );
            
            @SuppressWarnings("unchecked")
            Map<String, Object> uploadResult = cloudinary.uploader().upload(file.getBytes(), params);
            
            String secureUrl = (String) uploadResult.get("secure_url");
            document.setStoragePath(secureUrl);
            
            System.out.println("[DocumentService] Uploaded to Cloudinary: " + secureUrl);
        } else {
            String storedFileName = UUID.randomUUID().toString() + extension;
            Path storagePath = Paths.get(uploadDir).resolve(storedFileName);
            Files.copy(file.getInputStream(), storagePath);
            document.setStoragePath(storagePath.toAbsolutePath().toString());
        }

        Document savedDocument = documentRepository.save(document);

        try {
            String documentId = "DOC-" + savedDocument.getId();
            String message = String.format(
                "{\"type\":\"document_update\",\"documentId\":\"%s\",\"fileName\":\"%s\",\"userId\":%d}",
                documentId, savedDocument.getFileName(), savedDocument.getUserId()
            );
            dashboardWebSocketHandler.broadcastMessage(message);
        } catch (Exception e) {
            System.err.println("Failed to send WebSocket notification: " + e.getMessage());
        }

        try {
            Notification notification = new Notification();
            notification.setUserId(user.getId());
            notification.setTitle("Document Uploaded");
            notification.setMessage("Your document \"" + savedDocument.getFileName() + "\" has been uploaded successfully.");
            notification.setType("DOCUMENT");
            notification.setRead(false);
            notification.setCreatedDate(LocalDateTime.now());
            notificationService.saveNotification(notification);
        } catch (Exception e) {
            System.err.println("Failed to create notification: " + e.getMessage());
        }

        return savedDocument;
    }

    public List<Document> saveDocuments(List<MultipartFile> files, String userEmail) throws IOException {
        return files.stream().map(file -> {
            try {
                return saveDocument(file, userEmail);
            } catch (IOException e) {
                throw new RuntimeException("Failed to save file: " + file.getOriginalFilename(), e);
            }
        }).collect(Collectors.toList());
    }

    public Resource loadDocumentResource(Long documentId, String userEmail) throws IOException {
        User user = userRepository.findByEmail(userEmail)
                .orElseThrow(() -> new RuntimeException("User not found"));

        Document document = documentRepository.findById(documentId)
                .orElseThrow(() -> new RuntimeException("Document not found"));

        if (!document.getUserId().equals(user.getId())) {
            throw new RuntimeException("Access denied");
        }

        Path path = Paths.get(document.getStoragePath());
        if (!Files.exists(path)) {
            throw new RuntimeException("Document file is missing");
        }

        byte[] bytes = Files.readAllBytes(path);
        return new ByteArrayResource(bytes);
    }

    public Document getDocument(Long id) {
        return documentRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Document not found"));
    }

    public List<Document> getAllDocuments() {
        return documentRepository.findAllByOrderByUploadedAtDesc();
    }

    public List<Document> getDocumentsByUserId(Long userId) {
        return documentRepository.findByUserIdOrderByUploadedAtDesc(userId);
    }
}