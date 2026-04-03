package com.insurai.backend.controller;

import java.util.Map;

import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import com.insurai.backend.service.UserService;

@RestController
@RequestMapping("/api/user")
public class UserController {

    private final UserService userService;

    public UserController(UserService userService) {
        this.userService = userService;
    }

    @GetMapping("/dashboard")
    public ResponseEntity<Map<String, Object>> getDashboard(Authentication authentication) {
        String userEmail = authentication.getName();
        Map<String, Object> dashboardData = userService.getDashboardData(userEmail);
        return ResponseEntity.ok(dashboardData);
    }

    @GetMapping("/profile")
    public ResponseEntity<Map<String, Object>> getProfile(Authentication authentication) {
        String userEmail = authentication.getName();
        Map<String, Object> profileData = userService.getProfileData(userEmail);
        return ResponseEntity.ok(profileData);
    }

    @PutMapping("/profile")
    public ResponseEntity<Map<String, Object>> updateProfile(
            @RequestBody Map<String, Object> profileData,
            Authentication authentication) {
        String userEmail = authentication.getName();
        Map<String, Object> updatedData = userService.updateProfile(userEmail, profileData);
        return ResponseEntity.ok(updatedData);
    }

    @GetMapping("/verification-status")
    public ResponseEntity<Map<String, Object>> getVerificationStatus(Authentication authentication) {
        String userEmail = authentication.getName();
        Map<String, Object> verificationData = userService.getVerificationStatus(userEmail);
        return ResponseEntity.ok(verificationData);
    }

    // Underwriter dashboard stats
    @GetMapping("/underwriter/dashboard")
    public ResponseEntity<Map<String, Object>> getUnderwriterDashboard(Authentication authentication) {
        // Check if user has UNDERWRITER role
        boolean isUnderwriter = authentication.getAuthorities().stream()
            .anyMatch(auth -> {
                String authority = auth.getAuthority();
                return "ROLE_UNDERWRITER".equalsIgnoreCase(authority)
                        || "UNDERWRITER".equalsIgnoreCase(authority);
            });
        if (!isUnderwriter) {
            return ResponseEntity.status(403).build();
        }
        Map<String, Object> dashboardData = userService.getUnderwriterDashboardData();
        return ResponseEntity.ok(dashboardData);
    }
}
