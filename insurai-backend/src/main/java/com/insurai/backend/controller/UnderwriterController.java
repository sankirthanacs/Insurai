package com.insurai.backend.controller;

import java.math.BigDecimal;
import java.util.HashMap;
import java.util.List;
import java.util.Map;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import com.insurai.backend.DashboardWebSocketHandler;
import com.insurai.backend.entity.Claim;
import com.insurai.backend.entity.Policy;
import com.insurai.backend.entity.User;
import com.insurai.backend.repository.ClaimRepository;
import com.insurai.backend.repository.PolicyRepository;
import com.insurai.backend.repository.UserRepository;

@RestController
@RequestMapping("/api/underwriter")
@PreAuthorize("hasRole('UNDERWRITER')")
public class UnderwriterController {

    @Autowired
    private ClaimRepository claimRepository;

    @Autowired
    private PolicyRepository policyRepository;

    @Autowired
    private UserRepository userRepository;

    @Autowired
    private DashboardWebSocketHandler webSocketHandler;

    @GetMapping("/decisions")
    @PreAuthorize("hasRole('UNDERWRITER')")
    public ResponseEntity<List<Map<String, Object>>> getDecisions() {
        List<com.insurai.backend.entity.Claim> recentClaims = claimRepository.findTop5ByOrderByCreatedDateDesc();

        List<Map<String, Object>> decisions = recentClaims.stream().map(claim -> {
            Map<String, Object> decision = new HashMap<>();
            decision.put("id", claim.getId());
            decision.put("type", claim.getType());
            
            // Fetch actual user name instead of User #ID
            String customerName = "Unknown";
            try {
                User user = userRepository.findById(claim.getUserId()).orElse(null);
                if (user != null) {
                    String firstName = user.getFirstName() != null ? user.getFirstName() : "";
                    String lastName = user.getLastName() != null ? user.getLastName() : "";
                    customerName = (firstName + " " + lastName).trim();
                    if (customerName.isEmpty()) {
                        customerName = user.getUsername() != null ? user.getUsername() : "User #" + claim.getUserId();
                    }
                }
            } catch (Exception e) {
                customerName = "User #" + claim.getUserId();
            }
            decision.put("customer", customerName);
            
            decision.put("amount", claim.getAmount());
            decision.put("riskScore", claim.getRiskLevel() != null ? claim.getRiskLevel() : calculateRiskLevelFromClaim(claim));
            decision.put("decision", claim.getStatus());
            decision.put("underwriter", "Auto Underwriter");
            decision.put("timestamp", claim.getUpdatedDate() != null ? claim.getUpdatedDate() : claim.getCreatedDate());
            return decision;
        }).toList();

        return ResponseEntity.ok(decisions);
    }

    private String calculateRiskLevelFromClaim(com.insurai.backend.entity.Claim claim) {
        if (claim.getRiskLevel() != null && !claim.getRiskLevel().isBlank()) {
            return claim.getRiskLevel();
        }
        if (claim.getAmount() == null) {
            return "LOW";
        }
        if (claim.getAmount().compareTo(new java.math.BigDecimal("5000")) >= 0) {
            return "HIGH";
        }
        if (claim.getAmount().compareTo(new java.math.BigDecimal("2500")) >= 0) {
            return "MEDIUM";
        }
        return "LOW";
    }

    @PostMapping("/update-claim-status")
    @PreAuthorize("hasRole('UNDERWRITER')")
    public ResponseEntity<String> updateClaimStatus(@RequestBody Map<String, Object> payload) {
        // Broadcast the update to all WebSocket clients
        String message = String.format(
            "{\"type\":\"claimStatusUpdated\",\"claimId\":\"%s\",\"status\":\"%s\",\"message\":\"%s\",\"source\":\"underwriter\"}",
            payload.getOrDefault("claimId", "unknown"),
            payload.getOrDefault("status", "updated"),
            payload.getOrDefault("message", "Claim status updated"),
            payload.getOrDefault("message", "Claim status updated")
        );
        webSocketHandler.broadcastMessage(message);
        return ResponseEntity.ok("Claim status updated and broadcasted.");
    }

    @PostMapping("/submit-claim")
    @PreAuthorize("hasRole('UNDERWRITER')")
    public ResponseEntity<String> submitClaim(@RequestBody Map<String, Object> claimData) {
        // Save claim to database
        Claim claim = new Claim();
        claim.setType((String) claimData.get("type")); // Updated to match the Claim entity
        claim.setStatus("Pending");
        claim.setAmount(new BigDecimal((Double) claimData.get("amount"))); // Convert Double to BigDecimal
        
        // Set userId if provided
        if (claimData.get("userId") != null) {
            Long userId = ((Number) claimData.get("userId")).longValue();
            claim.setUserId(userId);
            
            // Look up user's active policy and set policyId
            List<Policy> userPolicies = policyRepository.findByUserId(userId);
            if (userPolicies != null && !userPolicies.isEmpty()) {
                Policy activePolicy = userPolicies.stream()
                    .filter(p -> "ACTIVE".equals(p.getStatus()))
                    .findFirst()
                    .orElse(userPolicies.get(0));
                claim.setPolicyId(activePolicy.getId());
            }
        }
        
        claimRepository.save(claim);

        // Broadcast the new claim to all WebSocket clients
        String submitMessage = String.format(
            "{\"type\":\"claimSubmitted\",\"claimId\":\"%s\",\"status\":\"%s\",\"message\":\"New claim submitted\",\"source\":\"underwriter\"}",
            claim.getId(), claim.getStatus());
        webSocketHandler.broadcastMessage(submitMessage);
        return ResponseEntity.ok("Claim submitted and saved.");
    }

    @PostMapping("/upload-document")
    @PreAuthorize("hasRole('UNDERWRITER')")
    public ResponseEntity<String> uploadDocument(@RequestBody Map<String, Object> documentData) {
        // Broadcast the uploaded document to all WebSocket clients
        String documentMessage = String.format(
            "{\"type\":\"documentUploaded\",\"documentId\":\"%s\",\"message\":\"Document uploaded\",\"source\":\"underwriter\"}",
            documentData.getOrDefault("documentId", "unknown")
        );
        webSocketHandler.broadcastMessage(documentMessage);
        return ResponseEntity.ok("Document uploaded and broadcasted.");
    }

    @PostMapping("/approve-reject-claim")
    @PreAuthorize("hasRole('UNDERWRITER')")
    public ResponseEntity<String> approveOrRejectClaim(@RequestBody Map<String, Object> decisionData) {
        boolean approved = "APPROVED".equalsIgnoreCase((String) decisionData.getOrDefault("status", ""));
        String decisionMessage = String.format(
            "{\"type\":\"claimDecision\",\"claimId\":\"%s\",\"status\":\"%s\",\"message\":\"%s\",\"source\":\"underwriter\"}",
            decisionData.getOrDefault("claimId", "unknown"),
            decisionData.getOrDefault("status", "UNKNOWN"),
            approved ? "Claim approved" : "Claim rejected"
        );
        webSocketHandler.broadcastMessage(decisionMessage);
        return ResponseEntity.ok("Claim decision broadcasted.");
    }

    @GetMapping("/notifications")
    @PreAuthorize("hasRole('UNDERWRITER')")
    public ResponseEntity<List<String>> getNotifications() {
        // Example response, replace with actual logic
        List<String> notifications = List.of("Notification 1", "Notification 2", "Notification 3");
        return ResponseEntity.ok(notifications);
    }

    @GetMapping("/recent-activity")
    @PreAuthorize("hasRole('UNDERWRITER')")
    public ResponseEntity<List<Map<String, Object>>> getRecentActivity() {
        List<Claim> recentClaims = claimRepository.findTop10ByOrderByUpdatedDateDesc();
        
        List<Map<String, Object>> activities = recentClaims.stream().map(claim -> {
            Map<String, Object> activity = new HashMap<>();
            activity.put("id", claim.getId());
            activity.put("type", "CLAIM_" + (claim.getStatus() != null ? claim.getStatus().toUpperCase() : "UPDATED"));
            activity.put("description", "Claim #" + claim.getId() + " - " + (claim.getStatus() != null ? claim.getStatus() : "Updated"));
            activity.put("timestamp", claim.getUpdatedDate() != null ? claim.getUpdatedDate() : claim.getCreatedDate());
            activity.put("claimId", claim.getId());
            return activity;
        }).toList();
        
        return ResponseEntity.ok(activities);
    }
}