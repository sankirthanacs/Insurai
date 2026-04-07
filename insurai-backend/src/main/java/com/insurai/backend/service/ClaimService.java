package com.insurai.backend.service;

import java.time.LocalDateTime;
import java.util.Optional;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import com.insurai.backend.DashboardWebSocketHandler;
import com.insurai.backend.dto.ClaimDTO;
import com.insurai.backend.entity.Claim;
import com.insurai.backend.entity.Notification;
import com.insurai.backend.entity.Policy;
import com.insurai.backend.entity.User;
import com.insurai.backend.repository.ClaimRepository;
import com.insurai.backend.repository.PolicyRepository;
import com.insurai.backend.repository.UserRepository;
import com.fasterxml.jackson.databind.ObjectMapper;

@Service
@Transactional(readOnly = true)
public class ClaimService {

    @Autowired
    private ClaimRepository claimRepository;

    @Autowired
    private PolicyRepository policyRepository;

    @Autowired
    private UserRepository userRepository;

    @Autowired
    private DashboardWebSocketHandler dashboardWebSocketHandler;

    @Autowired
    private NotificationService notificationService;

    @Autowired
    private EmailService emailService;

    @Autowired
    private ObjectMapper objectMapper;

    public Page<Claim> getAllClaims(Pageable pageable) {
        Page<Claim> claims = claimRepository.findAll(pageable);
        enrichClaimsWithPolicyNumber(claims);
        return claims;
    }

    // ✅ FIXED METHOD (USED BY CONTROLLER)
    public Page<Claim> getUserClaimsByEmail(String email, Pageable pageable) {
        User user = userRepository.findByEmail(email)
                .orElseThrow(() -> new RuntimeException("User not found"));

        Page<Claim> claims = claimRepository.findByUserId(user.getId(), pageable);
        enrichClaimsWithPolicyNumber(claims);
        return claims;
    }

    private void enrichClaimsWithPolicyNumber(Page<Claim> claims) {
        if (claims == null || claims.isEmpty()) {
            return;
        }

        claims.forEach(claim -> {
            if (claim.getPolicyId() != null) {
                policyRepository.findById(claim.getPolicyId()).ifPresent(policy -> {
                    claim.setPolicyNumber(policy.getPolicyNumber() != null ? policy.getPolicyNumber() : "Unknown Policy");
                });
            } else {
                claim.setPolicyNumber("No Policy");
            }
        });
    }

    public Optional<Claim> getClaimById(Long id) {
        return claimRepository.findById(id);
    }

    // ✅ FIXED METHOD (USED BY CONTROLLER)
    @Transactional
    public Claim submitClaimByEmail(ClaimDTO claimDTO, String email) {
        User user = userRepository.findByEmail(email)
                .orElseThrow(() -> new RuntimeException("User not found"));

        Claim claim = new Claim();
        claim.setUserId(user.getId());
        claim.setType(claimDTO.getClaimType());
        claim.setAmount(claimDTO.getAmount());
        claim.setDescription(claimDTO.getDescription());
        claim.setStatus("PENDING");
        claim.setCreatedDate(LocalDateTime.now());
        claim.setRiskLevel("MEDIUM");
        claim.setPaymentTermMonths(claimDTO.getPaymentTermMonths());
        claim.setMonthlyPayment(claimDTO.getMonthlyPayment());
        claim.setDocuments(claimDTO.getDocuments());

        // Set policyId from DTO if provided, otherwise look up user's active policy
        if (claimDTO.getPolicyId() != null) {
            claim.setPolicyId(claimDTO.getPolicyId());
        } else {
            java.util.List<Policy> userPolicies = policyRepository.findByUserId(user.getId());
            if (userPolicies != null && !userPolicies.isEmpty()) {
                Policy activePolicy = userPolicies.stream()
                    .filter(p -> "ACTIVE".equals(p.getStatus()))
                    .findFirst()
                    .orElse(userPolicies.get(0));
                claim.setPolicyId(activePolicy.getId());
            }
        }

        Claim savedClaim = claimRepository.save(claim);

        // Send WebSocket notification for real-time update
        try {
            String claimId = "CLM-" + savedClaim.getId();
            String message = String.format(
                "{\"type\":\"claimSubmitted\",\"claimId\":\"%s\",\"status\":\"%s\",\"userId\":%d}",
                claimId, savedClaim.getStatus(), savedClaim.getUserId()
            );
            dashboardWebSocketHandler.broadcastMessage(message);
        } catch (Exception e) {
            // Log error but don't fail the claim submission
            System.err.println("Failed to send WebSocket notification: " + e.getMessage());
        }

        // Create and send notification via SSE
        try {
            Notification notification = new Notification();
            notification.setUserId(user.getId());
            notification.setTitle("Claim Submitted");
            notification.setMessage("Your claim " + "CLM-" + savedClaim.getId() + " has been submitted successfully.");
            notification.setType("CLAIM");
            notification.setRead(false);
            notification.setCreatedDate(LocalDateTime.now());
            notificationService.saveNotification(notification);
        } catch (Exception e) {
            // Log error but don't fail the claim submission
            System.err.println("Failed to create notification: " + e.getMessage());
        }

        // Send confirmation email
        try {
            emailService.sendClaimSubmissionEmail(user, savedClaim);
        } catch (Exception e) {
            System.err.println("Failed to send confirmation email: " + e.getMessage());
        }

        return savedClaim;
    }

    @Transactional
    public Claim updateClaim(Long id, ClaimDTO claimDTO) {
        Claim claim = claimRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Claim not found"));

        claim.setType(claimDTO.getClaimType());
        claim.setAmount(claimDTO.getAmount());
        claim.setDescription(claimDTO.getDescription());
        claim.setPaymentTermMonths(claimDTO.getPaymentTermMonths());
        claim.setMonthlyPayment(claimDTO.getMonthlyPayment());

        return claimRepository.save(claim);
    }

    @Transactional
    public void deleteClaim(Long id) {
        claimRepository.deleteById(id);
    }

    public Page<Claim> getHighRiskClaims(Pageable pageable) {
        return claimRepository.findByRiskLevel("HIGH", pageable);
    }

    @Transactional
    public Claim approveClaim(Long claimId, String notes) {
        Claim claim = claimRepository.findById(claimId)
                .orElseThrow(() -> new RuntimeException("Claim not found"));

        claim.setStatus("APPROVED");
        claim.setUnderwriterNotes(notes);
        claim.setUpdatedDate(LocalDateTime.now());

        Claim savedClaim = claimRepository.save(claim);

        // Send WebSocket notification for real-time update
        try {
            String claimIdStr = "CLM-" + savedClaim.getId();
            String message = String.format(
                "{\"type\":\"claim_update\",\"claimId\":\"%s\",\"status\":\"%s\",\"userId\":%d}",
                claimIdStr, savedClaim.getStatus(), savedClaim.getUserId()
            );
            dashboardWebSocketHandler.broadcastMessage(message);
        } catch (Exception e) {
            System.err.println("Failed to send WebSocket notification: " + e.getMessage());
        }

        // Create and send notification via SSE
        try {
            User user = userRepository.findById(savedClaim.getUserId()).orElse(null);
            if (user != null) {
                Notification notification = new Notification();
                notification.setUserId(user.getId());
                notification.setTitle("Claim Approved");
                notification.setMessage("Your claim " + "CLM-" + savedClaim.getId() + " has been approved.");
                notification.setType("CLAIM");
                notification.setRead(false);
                notification.setCreatedDate(LocalDateTime.now());
                notificationService.saveNotification(notification);

                // Send approval email
                try {
                    emailService.sendClaimApprovalEmail(user, savedClaim);
                } catch (Exception e) {
                    System.err.println("Failed to send approval email: " + e.getMessage());
                }
            }
        } catch (Exception e) {
            System.err.println("Failed to create notification: " + e.getMessage());
        }

        return savedClaim;
    }

    @Transactional
    public Claim rejectClaim(Long claimId, String notes) {
        Claim claim = claimRepository.findById(claimId)
                .orElseThrow(() -> new RuntimeException("Claim not found"));

        claim.setStatus("REJECTED");
        claim.setUnderwriterNotes(notes);
        claim.setUpdatedDate(LocalDateTime.now());

        Claim savedClaim = claimRepository.save(claim);

        // Send WebSocket notification for real-time update
        try {
            String claimIdStr = "CLM-" + savedClaim.getId();
            String message = String.format(
                "{\"type\":\"claim_update\",\"claimId\":\"%s\",\"status\":\"%s\",\"userId\":%d}",
                claimIdStr, savedClaim.getStatus(), savedClaim.getUserId()
            );
            dashboardWebSocketHandler.broadcastMessage(message);
        } catch (Exception e) {
            System.err.println("Failed to send WebSocket notification: " + e.getMessage());
        }

        // Create and send notification via SSE
        try {
            User user = userRepository.findById(savedClaim.getUserId()).orElse(null);
            if (user != null) {
                Notification notification = new Notification();
                notification.setUserId(user.getId());
                notification.setTitle("Claim Rejected");
                notification.setMessage("Your claim " + "CLM-" + savedClaim.getId() + " has been rejected.");
                notification.setType("CLAIM");
                notification.setRead(false);
                notification.setCreatedDate(LocalDateTime.now());
                notificationService.saveNotification(notification);

                // Send rejection email
                try {
                    emailService.sendClaimRejectionEmail(user, savedClaim);
                } catch (Exception e) {
                    System.err.println("Failed to send rejection email: " + e.getMessage());
                }
            }
        } catch (Exception e) {
            System.err.println("Failed to create notification: " + e.getMessage());
        }

        return savedClaim;
    }

    @Transactional
    public Claim submitUnderwriterDecision(Long claimId, String decision, String notes) {
        if ("APPROVED".equalsIgnoreCase(decision)) {
            return approveClaim(claimId, notes);
        } else if ("REJECTED".equalsIgnoreCase(decision)) {
            return rejectClaim(claimId, notes);
        } else {
            throw new RuntimeException("Invalid decision");
        }
    }
}