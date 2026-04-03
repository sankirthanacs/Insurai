package com.insurai.backend.service;

import java.util.List;

import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import com.insurai.backend.entity.Document;
import com.insurai.backend.entity.User;
import com.insurai.backend.entity.Verification;
import com.insurai.backend.repository.DocumentRepository;
import com.insurai.backend.repository.UserRepository;
import com.insurai.backend.repository.VerificationRepository;

@Service
@Transactional(readOnly = true) // applies to all read methods by default
public class VerificationService {

    private final VerificationRepository verificationRepository;
    private final UserRepository userRepository;
    private final DocumentRepository documentRepository;

    public VerificationService(VerificationRepository verificationRepository, 
                              UserRepository userRepository,
                              DocumentRepository documentRepository) {
        this.verificationRepository = verificationRepository;
        this.userRepository = userRepository;
        this.documentRepository = documentRepository;
    }

    // ✅ Pagination instead of findAll()
    public Page<Verification> getAllVerifications(Pageable pageable) {
        Page<Verification> verifications = verificationRepository.findAll(pageable);
        System.out.println("Fetched " + verifications.getContent().size() + " verifications");
        // Populate documents for each verification
        verifications.getContent().forEach(this::populateDocuments);
        return verifications;
    }

    private void populateDocuments(Verification verification) {
        if (verification.getEmployeeName() != null) {
            // Find user by email (employeeName is the email)
            userRepository.findByEmail(verification.getEmployeeName()).ifPresentOrElse(user -> {
                // Fetch documents for this user
                List<Document> documents = documentRepository.findByUserIdOrderByUploadedAtDesc(user.getId());
                verification.setDocuments(documents);
                System.out.println("Found " + documents.size() + " documents for user: " + user.getEmail());
            }, () -> {
                System.out.println("No user found for email: " + verification.getEmployeeName());
            });
        } else {
            System.out.println("EmployeeName is null for verification: " + verification.getId());
        }
    }

    // ✅ Write operation → override readOnly
    @Transactional
    public Verification saveVerification(Verification verification) {
        return verificationRepository.save(verification);
    }

    @Transactional
    public Verification approveVerification(Long id) {
        Verification verification = verificationRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Verification not found with id: " + id));
        verification.setStatus("VERIFIED");
        return verificationRepository.save(verification);
    }

    @Transactional
    public Verification rejectVerification(Long id) {
        Verification verification = verificationRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Verification not found with id: " + id));
        verification.setStatus("REJECTED");
        return verificationRepository.save(verification);
    }
}