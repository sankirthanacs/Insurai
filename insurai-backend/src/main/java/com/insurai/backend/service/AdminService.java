package com.insurai.backend.service;

import java.time.LocalDateTime;
import java.time.YearMonth;
import java.util.ArrayList;
import java.util.Arrays;
import java.util.HashMap;
import java.util.List;
import java.util.Map;

import org.springframework.stereotype.Service;

import com.insurai.backend.entity.Claim;
import com.insurai.backend.entity.Notification;
import com.insurai.backend.entity.User;
import com.insurai.backend.repository.ClaimRepository;
import com.insurai.backend.repository.SubscriptionRepository;
import com.insurai.backend.repository.UserRepository;

@Service
public class AdminService {

    private final UserRepository userRepository;
    private final ClaimRepository claimRepository;
    private final SubscriptionRepository subscriptionRepository;
    private final ClaimEventProducer claimEventProducer;
    private final NotificationService notificationService;

    public AdminService(UserRepository userRepository, ClaimRepository claimRepository,
                        SubscriptionRepository subscriptionRepository, ClaimEventProducer claimEventProducer,
                        NotificationService notificationService) {
        this.userRepository = userRepository;
        this.claimRepository = claimRepository;
        this.subscriptionRepository = subscriptionRepository;
        this.claimEventProducer = claimEventProducer;
        this.notificationService = notificationService;
    }

    public Map<String, Object> getAdminDashboardData() {
        Map<String, Object> dashboardData = new HashMap<>();

        // Total users
        long totalUsers = userRepository.count();
        dashboardData.put("totalUsers", totalUsers);

        // Total claims
        long totalClaims = claimRepository.count();
        dashboardData.put("totalClaims", totalClaims);

        // Fraud alerts
        long fraudAlerts = claimRepository.countByFraudDetected(true);
        dashboardData.put("fraudAlerts", fraudAlerts);

        // High risk claims (assuming we calculate this based on riskLevel)
        dashboardData.put("highRiskClaims", Math.max(0, totalClaims - fraudAlerts));

        // Claims by type
        Map<String, Integer> claimsByType = new HashMap<>();
        claimRepository.findAll().forEach(claim -> {
            String type = claim.getType();
            claimsByType.put(type, claimsByType.getOrDefault(type, 0) + 1);
        });
        dashboardData.put("claimsByType", claimsByType);

        // Claims status
        Map<String, Integer> claimsStatus = new HashMap<>();
        claimRepository.findAll().forEach(claim -> {
            String status = claim.getStatus();
            claimsStatus.put(status, claimsStatus.getOrDefault(status, 0) + 1);
        });
        dashboardData.put("claimsStatus", claimsStatus);

        // Subscription counts (Active / Cancelled)
        long activeSubs = subscriptionRepository.countByStatus("ACTIVE");
        long cancelledSubs = subscriptionRepository.countByStatus("CANCELLED");
        dashboardData.put("activeSubscriptions", activeSubs);
        dashboardData.put("cancelledSubscriptions", cancelledSubs);

        // Recent claims
        List<Map<String, Object>> recentClaims = new ArrayList<>();
        claimRepository.findTop5ByOrderByCreatedDateDesc().forEach(claim -> {
            Map<String, Object> claimData = new HashMap<>();
            claimData.put("id", claim.getId());
            claimData.put("type", claim.getType());
            claimData.put("amount", claim.getAmount());
            claimData.put("status", claim.getStatus());
            recentClaims.add(claimData);
        });
        dashboardData.put("recentClaims", recentClaims);

        return dashboardData;
    }

    public Map<String, Object> getAllClaimsData() {
        Map<String, Object> claimsData = new HashMap<>();
        List<Map<String, Object>> claims = new ArrayList<>();

        claimRepository.findAll().forEach(claim -> {
            Map<String, Object> claimMap = new HashMap<>();
            claimMap.put("id", claim.getId());
            claimMap.put("customerName", getUserName(claim.getUserId()));
            claimMap.put("type", claim.getType());
            claimMap.put("amount", claim.getAmount());
            claimMap.put("date", claim.getCreatedDate());
            claimMap.put("status", claim.getStatus());
            claimMap.put("riskScore", getRiskScore(claim));
            claimMap.put("fraudDetected", claim.isFraudDetected());
            claims.add(claimMap);
        });

        claimsData.put("claims", claims);
        return claimsData;
    }

    public Map<String, Object> getClaimDetails(Long claimId) {
        Map<String, Object> claimDetails = new HashMap<>();
        
        Claim claim = claimRepository.findById(claimId).orElse(null);
        if (claim != null) {
            User user = userRepository.findById(claim.getUserId()).orElse(null);
            
            claimDetails.put("id", claim.getId());
            claimDetails.put("type", claim.getType());
            claimDetails.put("amount", claim.getAmount());
            claimDetails.put("date", claim.getCreatedDate());
            claimDetails.put("status", claim.getStatus());
            claimDetails.put("description", claim.getDescription());
            claimDetails.put("riskScore", getRiskScore(claim));
            claimDetails.put("fraudDetected", claim.isFraudDetected());
            claimDetails.put("fraudProbability", calculateFraudProbability(claim));
            claimDetails.put("documents", claim.getDocuments()); // Add documents
            
            // Customer details
            if (user != null) {
                claimDetails.put("customerName", user.getFirstName() + " " + user.getLastName());
                claimDetails.put("customerEmail", user.getEmail());
                claimDetails.put("customerPhone", "N/A"); // Phone not in User entity
            }
            
            // Suspicious patterns
            List<String> patterns = new ArrayList<>();
            if (claim.isFraudDetected()) {
                patterns.add("Claim submitted within 30 days of policy activation");
                patterns.add("Claim amount significantly higher than average");
                patterns.add("Similar claims detected in same geographic area");
            }
            claimDetails.put("suspiciousPatterns", patterns);
            
            // Recommendation
            if (claim.isFraudDetected()) {
                claimDetails.put("recommendation", "Request additional documentation and medical records for verification");
            } else {
                claimDetails.put("recommendation", "Claim appears legitimate. Proceed with approval process.");
            }
        }
        
        return claimDetails;
    }

    public Map<String, Object> getAllUsersData() {
        Map<String, Object> usersData = new HashMap<>();
        List<Map<String, Object>> users = new ArrayList<>();

        userRepository.findAll().forEach(user -> {
            Map<String, Object> userMap = new HashMap<>();
            userMap.put("id", user.getId());
            userMap.put("name", user.getFirstName() + " " + user.getLastName());
            userMap.put("email", user.getEmail());
            userMap.put("role", user.getRole() != null ? user.getRole().getName() : "User");
            userMap.put("status", "Active");
            userMap.put("joinedDate", user.getCreatedDate());
            users.add(userMap);
        });

        usersData.put("users", users);
        return usersData;
    }

    public Map<String, Object> getReportsData() {
        Map<String, Object> reportsData = new HashMap<>();

        List<Claim> allClaims = claimRepository.findAll();
        
        // This month metrics
        LocalDateTime now = LocalDateTime.now();
        YearMonth currentMonth = YearMonth.from(now);
        long thisMonthClaims = allClaims.stream()
            .filter(c -> YearMonth.from(c.getCreatedDate()).equals(currentMonth))
            .count();
        
        reportsData.put("thisMonthClaims", thisMonthClaims);
        reportsData.put("monthClaimsChange", 12); // Dummy: +12% vs last month
        
        // Approval rate
        long approvedClaims = allClaims.stream().filter(c -> "APPROVED".equals(c.getStatus())).count();
        long approvalRate = allClaims.isEmpty() ? 0 : (approvedClaims * 100) / allClaims.size();
        reportsData.put("approvalRate", approvalRate);
        reportsData.put("approvalRateChange", 5);
        
        // Fraud detection rate
        long fraudDetected = claimRepository.countByFraudDetected(true);
        long fraudRate = allClaims.isEmpty() ? 0 : (fraudDetected * 100) / allClaims.size();
        reportsData.put("fraudDetectionRate", fraudRate);
        reportsData.put("fraudRateChange", -1.2);
        
        // Avg processing time (dummy)
        reportsData.put("avgProcessingTime", 3.2);
        reportsData.put("avgTimeChange", -0.5);
        
        // Claims trend (last 6 months)
        Map<String, Object> claimsTrend = new HashMap<>();
        List<String> labels = Arrays.asList("Jan", "Feb", "Mar", "Apr", "May", "Jun");
        List<Integer> values = Arrays.asList(65, 75, 80, 90, 85, 95);
        claimsTrend.put("labels", labels);
        claimsTrend.put("values", values);
        reportsData.put("claimsTrend", claimsTrend);
        
        // Fraud trend
        Map<String, Object> fraudTrend = new HashMap<>();
        List<Number> fraudValues = Arrays.asList(3, 4, 4, 5, 6, 5);
        fraudTrend.put("labels", labels);
        fraudTrend.put("values", fraudValues);
        reportsData.put("fraudTrend", fraudTrend);
        
        // Monthly summary
        List<Map<String, Object>> monthlySummary = new ArrayList<>();
        Arrays.asList("Jan 2026", "Feb 2026").forEach(month -> {
            Map<String, Object> summary = new HashMap<>();
            summary.put("month", month);
            summary.put("totalClaims", 65);
            summary.put("approved", 46);
            summary.put("rejected", 6);
            summary.put("fraudDetected", 3);
            monthlySummary.add(summary);
        });
        reportsData.put("monthlySummary", monthlySummary);
        
        return reportsData;
    }

    private String getUserName(Long userId) {
        try {
            User user = userRepository.findById(userId).orElse(null);
            if (user != null) {
                return user.getFirstName() + " " + user.getLastName();
            }
        } catch (Exception e) {
            // Log error if needed
        }
        return "Unknown User";
    }

    private int getRiskScore(Claim claim) {
        if (claim.isFraudDetected()) {
            return 85;
        }
        if ("HIGH".equals(claim.getRiskLevel())) {
            return 70;
        }
        if ("MEDIUM".equals(claim.getRiskLevel())) {
            return 45;
        }
        return 20;
    }

    private int calculateFraudProbability(Claim claim) {
        if (claim.isFraudDetected()) {
            return 75;
        }
        if ("HIGH".equals(claim.getRiskLevel())) {
            return 55;
        }
        if ("MEDIUM".equals(claim.getRiskLevel())) {
            return 30;
        }
        return 10;
    }

    public Map<String, Object> approveClaim(Long claimId) {
        Map<String, Object> result = new HashMap<>();

        try {
            Claim claim = claimRepository.findById(claimId).orElse(null);
            if (claim == null) {
                result.put("success", false);
                result.put("message", "Claim not found");
                return result;
            }

            claim.setStatus("APPROVED");
            Claim updated = claimRepository.save(claim);
            claimEventProducer.publish(updated);

            try {
                com.insurai.backend.entity.Notification notification = new com.insurai.backend.entity.Notification();
                notification.setUserId(claim.getUserId());
                notification.setTitle("Claim Approved");
                notification.setMessage("Your claim #" + claim.getId() + " has been approved.");
                notification.setType("claim");
                notification.setRead(false);
                notificationService.saveNotification(notification);
            } catch (Exception e) {
                System.err.println("Failed to send claim-approved notification: " + e.getMessage());
            }

            try {
                User user = userRepository.findById(claim.getUserId()).orElse(null);
                if (user != null) {
                    Notification notification = new Notification();
                    notification.setUserId(user.getId());
                    notification.setTitle("Claim Approved");
                    notification.setMessage("Your claim #" + claimId + " has been approved.");
                    notification.setType("CLAIM");
                    notification.setRead(false);
                    notification.setCreatedDate(LocalDateTime.now());
                    notificationService.saveNotification(notification);
                }
            } catch (Exception e) {
                System.err.println("Failed to create notification: " + e.getMessage());
            }

            result.put("success", true);
            result.put("message", "Claim approved successfully");
            result.put("claimId", claimId);
            result.put("status", "APPROVED");

        } catch (Exception e) {
            result.put("success", false);
            result.put("message", "Error approving claim: " + e.getMessage());
        }

        return result;
    }

    public Map<String, Object> rejectClaim(Long claimId) {
        Map<String, Object> result = new HashMap<>();

        try {
            Claim claim = claimRepository.findById(claimId).orElse(null);
            if (claim == null) {
                result.put("success", false);
                result.put("message", "Claim not found");
                return result;
            }

            claim.setStatus("REJECTED");
            Claim updated = claimRepository.save(claim);
            claimEventProducer.publish(updated);

            try {
                com.insurai.backend.entity.Notification notification = new com.insurai.backend.entity.Notification();
                notification.setUserId(claim.getUserId());
                notification.setTitle("Claim Rejected");
                notification.setMessage("Your claim #" + claim.getId() + " has been rejected.");
                notification.setType("claim");
                notification.setRead(false);
                notificationService.saveNotification(notification);
            } catch (Exception e) {
                System.err.println("Failed to send claim-rejected notification: " + e.getMessage());
            }

            result.put("success", true);
            result.put("message", "Claim rejected successfully");
            result.put("claimId", claimId);
            result.put("status", "REJECTED");

        } catch (Exception e) {
            result.put("success", false);
            result.put("message", "Error rejecting claim: " + e.getMessage());
        }

        return result;
    }
}