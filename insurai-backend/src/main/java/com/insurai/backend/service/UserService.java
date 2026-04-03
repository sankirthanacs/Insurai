package com.insurai.backend.service;

import java.util.ArrayList;
import java.util.HashMap;
import java.util.List;
import java.util.Map;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.data.domain.PageRequest;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import com.insurai.backend.entity.Claim;
import com.insurai.backend.entity.Policy;
import com.insurai.backend.entity.User;
import com.insurai.backend.entity.Verification;
import com.insurai.backend.repository.ClaimRepository;
import com.insurai.backend.repository.PolicyRepository;
import com.insurai.backend.repository.SubscriptionRepository;
import com.insurai.backend.repository.UserRepository;
import com.insurai.backend.repository.VerificationRepository;

@Service
@Transactional(readOnly = true)
public class UserService {

    @Autowired
    private UserRepository userRepository;
    
    @Autowired
    private PolicyRepository policyRepository;
    
    @Autowired
    private ClaimRepository claimRepository;

    @Autowired
    private SubscriptionRepository subscriptionRepository;

    @Autowired
    private VerificationRepository verificationRepository;

    public User getUserByEmail(String email) {
        User user = userRepository.findByEmail(email)
                .orElseThrow(() -> new RuntimeException("User not found"));
        return user;
    }

    public Map<String, Object> getDashboardData(String userEmail) {
        User user = getUserByEmail(userEmail);
        Map<String, Object> dashboardData = new HashMap<>();
        
        dashboardData.put("email", user.getEmail());
        dashboardData.put("firstName", user.getFirstName());
        dashboardData.put("lastName", user.getLastName());
        
        // Get policy statistics
        List<Policy> userPolicies = policyRepository.findByUserId(user.getId());
        long activePolicies = userPolicies.stream()
                .filter(p -> p.getStatus().equals("ACTIVE"))
                .count();
        
        dashboardData.put("activePolicies", activePolicies);
        dashboardData.put("policiesInfo", activePolicies + " active policies");
        
        // Get claim statistics
        List<Claim> userClaims = claimRepository.findByUserId(user.getId());
        long totalClaims = userClaims.size();
        long approvedClaims = userClaims.stream()
                .filter(c -> c.getStatus().equals("APPROVED"))
                .count();
        long pendingClaims = userClaims.stream()
                .filter(c -> c.getStatus().equals("PENDING"))
                .count();
        long rejectedClaims = userClaims.stream()
                .filter(c -> c.getStatus().equals("REJECTED"))
                .count();
        
        dashboardData.put("totalClaims", totalClaims);
        dashboardData.put("approvedClaims", approvedClaims);
        dashboardData.put("pendingClaims", pendingClaims);
        dashboardData.put("rejectedClaims", rejectedClaims);
        
        // Get recent claims
        List<Map<String, Object>> recentClaims = new ArrayList<>();
        userClaims.stream()
                .sorted((a, b) -> b.getCreatedDate().compareTo(a.getCreatedDate()))
                .limit(5)
                .forEach(claim -> {
                    Map<String, Object> claimMap = new HashMap<>();
                    claimMap.put("id", "CLM-" + claim.getId());
                    claimMap.put("type", claim.getType());
                    claimMap.put("amount", claim.getAmount());
                    claimMap.put("createdDate", claim.getCreatedDate());
                    claimMap.put("status", claim.getStatus());
                    claimMap.put("riskScore", claim.getRiskLevel() != null ? claim.getRiskLevel() : "Medium");
                    recentClaims.add(claimMap);
                });
        
        dashboardData.put("recentClaims", recentClaims);

        // Include subscription details if available
        subscriptionRepository.findByUserId(user.getId()).ifPresent(subscription -> {
            dashboardData.put("subscriptionPlan", subscription.getPlan());
            dashboardData.put("subscriptionStatus", subscription.getStatus());
            dashboardData.put("subscriptionRenewal", subscription.getRenewalDate());
            dashboardData.put("subscriptionCost", subscription.getCost());
        });
        
        return dashboardData;
    }

    public Map<String, Object> getProfileData(String userEmail) {
        User user = getUserByEmail(userEmail);
        Map<String, Object> profileData = new HashMap<>();
        
        profileData.put("id", user.getId());
        profileData.put("email", user.getEmail());
        profileData.put("firstName", user.getFirstName());
        profileData.put("lastName", user.getLastName());
        profileData.put("fullName", (user.getFirstName() != null ? user.getFirstName() : "") + 
                        (user.getLastName() != null ? " " + user.getLastName() : ""));
        profileData.put("createdDate", user.getCreatedDate());
        profileData.put("role", user.getRole() != null ? user.getRole().getName() : "USER");
        
        // Add profile information
        profileData.put("phoneNumber", user.getPhoneNumber() != null ? user.getPhoneNumber() : "");
        profileData.put("address", user.getAddress() != null ? user.getAddress() : "");
        profileData.put("city", user.getCity() != null ? user.getCity() : "");
        profileData.put("state", user.getState() != null ? user.getState() : "");
        profileData.put("zipCode", user.getZipCode() != null ? user.getZipCode() : "");
        profileData.put("dateOfBirth", user.getDateOfBirth() != null ? user.getDateOfBirth() : "");
        profileData.put("gender", user.getGender() != null ? user.getGender() : "");
        profileData.put("profilePicture", user.getProfilePicture() != null ? user.getProfilePicture() : "");
        
        // Include preferences
        profileData.put("language", user.getLanguage());
        profileData.put("currency", user.getCurrency());
        profileData.put("timezone", user.getTimezone());
        profileData.put("theme", user.getTheme());
        
        return profileData;
    }

    public Map<String, Object> updateProfile(String userEmail, Map<String, Object> profileData) {
        User user = getUserByEmail(userEmail);
        
        if (profileData.containsKey("fullName")) {
            String fullName = (String) profileData.get("fullName");
            String[] parts = fullName.trim().split("\\s+", 2);
            user.setFirstName(parts[0]);
            if (parts.length > 1) {
                user.setLastName(parts[1]);
            } else {
                user.setLastName("");
            }
        }
        
        if (profileData.containsKey("firstName")) {
            user.setFirstName((String) profileData.get("firstName"));
        }
        if (profileData.containsKey("lastName")) {
            user.setLastName((String) profileData.get("lastName"));
        }
        
        // Handle profile information
        if (profileData.containsKey("phoneNumber")) {
            user.setPhoneNumber((String) profileData.get("phoneNumber"));
        }
        if (profileData.containsKey("address")) {
            user.setAddress((String) profileData.get("address"));
        }
        if (profileData.containsKey("city")) {
            user.setCity((String) profileData.get("city"));
        }
        if (profileData.containsKey("state")) {
            user.setState((String) profileData.get("state"));
        }
        if (profileData.containsKey("zipCode")) {
            user.setZipCode((String) profileData.get("zipCode"));
        }
        if (profileData.containsKey("dateOfBirth")) {
            user.setDateOfBirth((String) profileData.get("dateOfBirth"));
        }
        if (profileData.containsKey("gender")) {
            user.setGender((String) profileData.get("gender"));
        }
        if (profileData.containsKey("profilePicture")) {
            user.setProfilePicture((String) profileData.get("profilePicture"));
        }
        
        // Handle preferences
        if (profileData.containsKey("language")) {
            user.setLanguage((String) profileData.get("language"));
        }
        if (profileData.containsKey("currency")) {
            user.setCurrency((String) profileData.get("currency"));
        }
        if (profileData.containsKey("timezone")) {
            user.setTimezone((String) profileData.get("timezone"));
        }
        if (profileData.containsKey("theme")) {
            user.setTheme((String) profileData.get("theme"));
        }
        
        userRepository.save(user);
        return getProfileData(userEmail);
    }

    public Map<String, Object> getVerificationStatus(String userEmail) {
        User user = getUserByEmail(userEmail);
        Map<String, Object> verificationData = new HashMap<>();
        
        // Get user verification status
        List<Verification> userVerifications = verificationRepository.findAll().stream()
                .filter(v -> v.getEmployeeName() != null && v.getEmployeeName().equals(user.getEmail()))
                .toList();
        
        boolean isUserVerified = userVerifications.stream()
                .anyMatch(v -> "USER_VERIFICATION".equals(v.getDocumentType()) && "VERIFIED".equals(v.getStatus()));
        
        verificationData.put("userVerified", isUserVerified);
        
        // Get claim verifications
        List<Claim> userClaims = claimRepository.findByUserId(user.getId());
        List<Map<String, Object>> claimVerifications = new ArrayList<>();
        
        for (Claim claim : userClaims) {
            List<Verification> claimVerifs = verificationRepository.findAll().stream()
                    .filter(v -> v.getEmployeeName() != null && v.getEmployeeName().equals(user.getEmail()) 
                            && "CLAIM_VERIFICATION".equals(v.getDocumentType()))
                    .toList();
            
            boolean isClaimVerified = claimVerifs.stream()
                    .anyMatch(v -> "VERIFIED".equals(v.getStatus()));
            
            Map<String, Object> claimVerif = new HashMap<>();
            claimVerif.put("claimId", claim.getId());
            claimVerif.put("claimType", claim.getType());
            claimVerif.put("verified", isClaimVerified);
            claimVerif.put("status", claim.getStatus());
            claimVerifications.add(claimVerif);
        }
        
        verificationData.put("claimVerifications", claimVerifications);
        
        return verificationData;
    }

    public Map<String, Object> getUnderwriterDashboardData() {
        Map<String, Object> dashboardData = new HashMap<>();

        List<Claim> allClaims = claimRepository.findAll();

        long pendingReviews = allClaims.stream()
                .filter(c -> "PENDING".equalsIgnoreCase(c.getStatus()))
                .count();

        long highRiskClaims = allClaims.stream()
                .filter(c -> "HIGH".equalsIgnoreCase(c.getRiskLevel()))
                .count();

        long approvedToday = allClaims.stream()
                .filter(c -> "APPROVED".equalsIgnoreCase(c.getStatus()) && c.getUpdatedDate() != null
                        && c.getUpdatedDate().toLocalDate().equals(java.time.LocalDate.now()))
                .count();

        long fraudAlerts = claimRepository.countByFraudDetected(true);

        long totalClaims = allClaims.size();
        long approvedClaims = allClaims.stream()
                .filter(c -> "APPROVED".equalsIgnoreCase(c.getStatus()))
                .count();
        long rejectedClaims = allClaims.stream()
                .filter(c -> "REJECTED".equalsIgnoreCase(c.getStatus()))
                .count();
        long underReview = pendingReviews;
        double approvalRate = totalClaims > 0 ? (approvedClaims * 100.0 / totalClaims) : 0.0;
        double rejectionRate = totalClaims > 0 ? (rejectedClaims * 100.0 / totalClaims) : 0.0;

        long lowRisk = allClaims.stream().filter(c -> "LOW".equalsIgnoreCase(c.getRiskLevel())).count();
        long mediumRisk = allClaims.stream().filter(c -> "MEDIUM".equalsIgnoreCase(c.getRiskLevel())).count();
        double avgRiskScore = allClaims.stream()
                .mapToDouble(c -> {
                    switch ((c.getRiskLevel() != null) ? c.getRiskLevel().toUpperCase() : "") {
                        case "LOW":
                            return 25.0;
                        case "MEDIUM":
                            return 55.0;
                        case "HIGH":
                            return 85.0;
                        default:
                            return 50.0;
                    }
                })
                .average()
                .orElse(0.0);

        dashboardData.put("pendingReviews", pendingReviews);
        dashboardData.put("highRiskClaims", highRiskClaims);
        dashboardData.put("approvedToday", approvedToday);
        dashboardData.put("fraudAlerts", fraudAlerts);
        dashboardData.put("totalClaims", totalClaims);
        dashboardData.put("approvedClaims", approvedClaims);
        dashboardData.put("rejectedClaims", rejectedClaims);
        dashboardData.put("underReview", underReview);
        dashboardData.put("approvalRate", String.format("%.1f", approvalRate));
        dashboardData.put("rejectionRate", String.format("%.1f", rejectionRate));
        dashboardData.put("avgRiskScore", String.format("%.1f", avgRiskScore));
        dashboardData.put("lowRiskCount", lowRisk);
        dashboardData.put("mediumRiskCount", mediumRisk);

        return dashboardData;
    }
}