package com.insurai.backend.service;

import java.util.ArrayList;
import java.util.Comparator;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.Optional;
import java.util.stream.Collectors;

import org.springframework.data.domain.PageRequest;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import com.insurai.backend.entity.Claim;
import com.insurai.backend.entity.Document;
import com.insurai.backend.entity.User;
import com.insurai.backend.entity.Verification;
import com.insurai.backend.repository.ClaimRepository;
import com.insurai.backend.repository.DocumentRepository;
import com.insurai.backend.repository.PolicyRepository;
import com.insurai.backend.repository.UserRepository;
import com.insurai.backend.repository.VerificationRepository;
import com.insurai.backend.service.VerificationService;

@Service
@Transactional(readOnly = true)
public class HrService {

    private final UserRepository userRepository;
    private final ClaimRepository claimRepository;
    private final PolicyRepository policyRepository;
    private final VerificationRepository verificationRepository;
    private final DocumentRepository documentRepository;
    private final VerificationService verificationService;

    public HrService(UserRepository userRepository,
                     ClaimRepository claimRepository,
                     PolicyRepository policyRepository,
                     VerificationRepository verificationRepository,
                     DocumentRepository documentRepository,
                     VerificationService verificationService) {
        this.userRepository = userRepository;
        this.claimRepository = claimRepository;
        this.policyRepository = policyRepository;
        this.verificationRepository = verificationRepository;
        this.documentRepository = documentRepository;
        this.verificationService = verificationService;
    }

    public Map<String, Object> getHrDashboardData() {
        Map<String, Object> data = new HashMap<>();

        long totalEmployees = userRepository.count();
        data.put("totalEmployees", totalEmployees);

        long activeClaims = claimRepository.countByStatus("PENDING");
        data.put("activeClaims", activeClaims);

        long benefitsEnrolled = policyRepository.count();
        data.put("benefitsEnrolled", benefitsEnrolled);

        // Pending verifications uses the same pending claims count for now
        data.put("pendingVerifications", activeClaims);

        // Provide a simple distribution for charting
        Map<String, Long> claimsByDepartment = claimRepository.findAll().stream()
                .collect(Collectors.groupingBy(Claim::getType, Collectors.counting()));
        data.put("claimsByDepartment", claimsByDepartment);

        return data;
    }

    public List<Map<String, Object>> getRecentClaims(int limit) {
        return claimRepository.findTop5ByOrderByCreatedDateDesc().stream().limit(limit)
                .map(claim -> {
                    Map<String, Object> m = new HashMap<>();
                    m.put("id", claim.getId());
                    m.put("claimId", claim.getId());
                    m.put("userId", claim.getUserId());
                    m.put("type", claim.getType());
                    m.put("amount", claim.getAmount());
                    m.put("status", claim.getStatus());
                    m.put("date", claim.getCreatedDate());

                    String customerName = "Unknown";
                    if (claim.getUserId() != null) {
                        userRepository.findById(claim.getUserId()).ifPresent(user -> {
                            String firstName = user.getFirstName() != null ? user.getFirstName() : "";
                            String lastName = user.getLastName() != null ? user.getLastName() : "";
                            String combined = (firstName + " " + lastName).trim();
                            if (!combined.isEmpty()) {
                                m.put("customerName", combined);
                            } else {
                                m.put("customerName", user.getEmail() != null ? user.getEmail() : "Unknown");
                            }
                        });
                    }

                    if (!m.containsKey("customerName")) {
                        m.put("customerName", customerName);
                    }

                    return m;
                })
                .collect(Collectors.toList());
    }

    public List<Map<String, Object>> getPendingVerifications(int limit) {
        return claimRepository.findAll().stream()
                .filter(claim -> "PENDING".equalsIgnoreCase(claim.getStatus()))
                .sorted(Comparator.comparing(Claim::getCreatedDate).reversed())
                .limit(limit)
                .map(claim -> {
                    Map<String, Object> m = new HashMap<>();
                    m.put("claimId", claim.getId());
                    m.put("employeeId", claim.getUserId());
                    m.put("type", claim.getType());
                    m.put("description", claim.getDescription());
                    m.put("date", claim.getCreatedDate());
                    return m;
                })
                .collect(Collectors.toList());
    }

    public List<Map<String, Object>> getVerificationsWithDocuments(int limit) {
        List<Verification> verifications = verificationService.getAllVerifications(PageRequest.of(0, limit)).getContent();
        List<Map<String, Object>> result = new ArrayList<>();
        
        for (Verification verification : verifications) {
            Map<String, Object> verificationData = new HashMap<>();
            verificationData.put("id", verification.getId());
            verificationData.put("employeeName", verification.getEmployeeName());
            verificationData.put("documentType", verification.getDocumentType());
            verificationData.put("status", verification.getStatus());
            verificationData.put("createdAt", verification.getCreatedAt());
            verificationData.put("priority", "Medium");
            
            // Get documents for this verification
            List<Document> documents = findDocumentsForVerification(verification);
            
            verificationData.put("documents", documents);
            
            result.add(verificationData);
        }
        
        return result;
    }
    
    private List<Document> findDocumentsForVerification(Verification verification) {
        List<Document> documents = new ArrayList<>();
        
        if (verification.getEmployeeName() == null || verification.getEmployeeName().isEmpty()) {
            return documents;
        }
        
        String employeeName = verification.getEmployeeName();
        
        // Method 1: Try to find user by email (employeeName)
        Optional<User> userByEmail = userRepository.findByEmail(employeeName);
        if (userByEmail.isPresent()) {
            User user = userByEmail.get();
            List<Document> userDocuments = documentRepository.findByUserIdOrderByUploadedAtDesc(user.getId());
            documents.addAll(userDocuments);
        }
        
        // Method 2: If no documents found by email, try to find by name match
        if (documents.isEmpty()) {
            String[] nameParts = employeeName.split("\\s+");
            if (nameParts.length > 0) {
                String firstName = nameParts[0];
                // Try to find user by first name match in email or name fields
                List<User> allUsers = userRepository.findAll();
                for (User user : allUsers) {
                    if (user.getFirstName() != null && user.getFirstName().toLowerCase().contains(firstName.toLowerCase())) {
                        List<Document> userDocuments = documentRepository.findByUserIdOrderByUploadedAtDesc(user.getId());
                        documents.addAll(userDocuments);
                        break;
                    }
                }
            }
        }
        
        // Method 3: If still no documents, get all documents and filter by filename containing employee name
        if (documents.isEmpty()) {
            List<Document> allDocuments = documentRepository.findAll();
            String employeeNameLower = employeeName.toLowerCase();
            for (Document doc : allDocuments) {
                if (doc.getFileName() != null && doc.getFileName().toLowerCase().contains(employeeNameLower)) {
                    documents.add(doc);
                }
            }
        }
        
        return documents;
    }
}
