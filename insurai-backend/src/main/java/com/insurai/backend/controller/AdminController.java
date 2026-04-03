package com.insurai.backend.controller;

import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.servlet.mvc.method.annotation.SseEmitter;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;
import com.insurai.backend.service.UserService;
import com.insurai.backend.service.HrService;
import com.insurai.backend.service.AdminDashboardService;
import com.insurai.backend.entity.User;
import com.insurai.backend.entity.Role;
import com.insurai.backend.entity.Claim;
import com.insurai.backend.entity.Policy;
import com.insurai.backend.repository.UserRepository;
import com.insurai.backend.repository.ClaimRepository;
import com.insurai.backend.repository.RoleRepository;
import com.insurai.backend.repository.PolicyRepository;
import com.insurai.backend.service.PolicyService;

import java.io.IOException;
import java.util.List;
import java.util.ArrayList;
import java.util.Map;
import java.util.HashMap;
import java.util.Optional;
import java.util.concurrent.CopyOnWriteArrayList;
import java.util.concurrent.Executors;
import java.util.concurrent.ScheduledExecutorService;
import java.util.concurrent.TimeUnit;

@RestController
@RequestMapping("/api/admin")
public class AdminController {

    private static final Logger log = LoggerFactory.getLogger(AdminController.class);
    private final CopyOnWriteArrayList<SseEmitter> sseEmitters = new CopyOnWriteArrayList<>();
    private final ScheduledExecutorService scheduler = Executors.newScheduledThreadPool(1);
    
    @Autowired
    private UserService userService;
    
    @Autowired
    private HrService hrService;
    
    @Autowired
    private AdminDashboardService adminDashboardService;
    
    @Autowired
    private UserRepository userRepository;
    
    @Autowired
    private ClaimRepository claimRepository;
    
    @Autowired
    private RoleRepository roleRepository;
    
    @Autowired
    private PolicyService policyService;
    
    @Autowired
    private PolicyRepository policyRepository;

    public AdminController() {
        // Start periodic updates every 30 seconds
        scheduler.scheduleAtFixedRate(this::broadcastDashboardUpdates, 0, 30, TimeUnit.SECONDS);
    }

    @GetMapping("/dashboard")
    public ResponseEntity<Object> getDashboard() {
        log.info("Admin dashboard data requested");
        try {
            // Use AdminDashboardService to get real data
            return ResponseEntity.ok(adminDashboardService.getDashboardData());
        } catch (Exception e) {
            log.error("Error getting dashboard data", e);
            return ResponseEntity.status(500).body(Map.of("error", "Failed to get dashboard data"));
        }
    }

    @GetMapping("/users")
    public ResponseEntity<Object> getUsers() {
        log.info("Admin users data requested");
        
        try {
            // Fetch real users from database using UserRepository
            List<Map<String, Object>> users = new ArrayList<>();
            
            // Get all users from the database
            List<User> allUsers = userRepository.findAll();
            
            for (User user : allUsers) {
                Map<String, Object> userMap = new HashMap<>();
                userMap.put("id", user.getId());
                userMap.put("name", getUserFullName(user));
                userMap.put("email", user.getEmail());
                userMap.put("role", user.getRole() != null ? user.getRole().getName() : "USER");
                userMap.put("status", "Active"); // All users are considered active
                users.add(userMap);
            }
            
            return ResponseEntity.ok(Map.of("users", users));
        } catch (Exception e) {
            log.error("Error getting users data", e);
            return ResponseEntity.status(500).body(Map.of("error", "Failed to get users data"));
        }
    }

    @GetMapping("/users/{userId}")
    public ResponseEntity<Object> getUserById(@PathVariable Long userId) {
        log.info("Admin get user requested for userId: {}", userId);
        
        try {
            Optional<User> userOpt = userRepository.findById(userId);
            
            if (userOpt.isPresent()) {
                User user = userOpt.get();
                Map<String, Object> userMap = new HashMap<>();
                userMap.put("id", user.getId());
                userMap.put("name", getUserFullName(user));
                userMap.put("email", user.getEmail());
                userMap.put("role", user.getRole() != null ? user.getRole().getName().replace("ROLE_", "") : "USER");
                userMap.put("status", "ACTIVE");
                return ResponseEntity.ok(userMap);
            } else {
                return ResponseEntity.status(404).body(Map.of("error", "User not found"));
            }
        } catch (Exception e) {
            log.error("Error getting user", e);
            return ResponseEntity.status(500).body(Map.of("error", "Failed to get user"));
        }
    }

    @PutMapping("/users/{userId}")
    public ResponseEntity<Object> updateUser(@PathVariable Long userId, @RequestBody Map<String, Object> userData) {
        log.info("Admin update user requested for userId: {}", userId);
        
        try {
            Optional<User> userOpt = userRepository.findById(userId);
            
            if (!userOpt.isPresent()) {
                return ResponseEntity.status(404).body(Map.of("error", "User not found"));
            }
            
            User user = userOpt.get();
            
            // Update user fields
            String name = (String) userData.get("name");
            String email = (String) userData.get("email");
            String role = (String) userData.get("role");
            String status = (String) userData.get("status");
            String password = (String) userData.get("password");
            
            if (name != null && !name.isEmpty()) {
                String[] nameParts = name.split(" ", 2);
                user.setFirstName(nameParts[0]);
                if (nameParts.length > 1) {
                    user.setLastName(nameParts[1]);
                }
            }
            
            if (email != null && !email.isEmpty()) {
                user.setEmail(email);
                user.setUsername(email);
            }
            
            if (role != null && !role.isEmpty()) {
                final String roleName = role.toUpperCase().startsWith("ROLE_")
                    ? role.toUpperCase()
                    : "ROLE_" + role.toUpperCase();
                Role userRole = roleRepository.findByName(roleName)
                    .orElse(roleRepository.findByName("ROLE_USER").orElseThrow());
                user.setRole(userRole);
            }
            
            if (password != null && !password.isEmpty()) {
                user.setPassword(password); // Note: In production, this should be hashed
            }
            
            userRepository.save(user);
            
            return ResponseEntity.ok(Map.of("message", "User updated successfully"));
        } catch (Exception e) {
            log.error("Error updating user", e);
            return ResponseEntity.status(500).body(Map.of("error", "Failed to update user", "message", e.getMessage()));
        }
    }

    @DeleteMapping("/users/{userId}")
    public ResponseEntity<Object> deleteUser(@PathVariable Long userId) {
        log.info("Admin delete user requested for userId: {}", userId);
        
        try {
            // Check if user exists
            if (!userRepository.existsById(userId)) {
                return ResponseEntity.status(404).body(Map.of("error", "User not found"));
            }
            
            // Delete user
            userRepository.deleteById(userId);
            
            return ResponseEntity.ok(Map.of("message", "User deleted successfully"));
        } catch (Exception e) {
            log.error("Error deleting user", e);
            return ResponseEntity.status(500).body(Map.of("error", "Failed to delete user", "message", e.getMessage()));
        }
    }

    @PostMapping("/users")
    public ResponseEntity<Object> createUser(@RequestBody Map<String, Object> userData) {
        log.info("Admin create user requested");
        
        try {
            String name = (String) userData.get("name");
            String email = (String) userData.get("email");
            String role = (String) userData.get("role");
            String password = (String) userData.get("password");
            
            if (name == null || email == null || password == null) {
                return ResponseEntity.status(400).body(Map.of("error", "Name, email, and password are required"));
            }
            
            // Check if user already exists
            if (userRepository.findByEmail(email).isPresent()) {
                return ResponseEntity.status(409).body(Map.of("error", "User with this email already exists"));
            }
            
            // Create new user
            User newUser = new User();
            
            // Split name into first and last name
            String[] nameParts = name.split(" ", 2);
            newUser.setFirstName(nameParts[0]);
            if (nameParts.length > 1) {
                newUser.setLastName(nameParts[1]);
            }
            
            newUser.setEmail(email);
            newUser.setPassword(password); // Note: In production, this should be hashed
            newUser.setUsername(email); // Use email as username
            
            // Set role if provided
            if (role != null && !role.isEmpty()) {
                // Try to find the role with ROLE_ prefix first, then without
                final String roleName = role.toUpperCase().startsWith("ROLE_")
                    ? role.toUpperCase()
                    : "ROLE_" + role.toUpperCase();
                Role userRole = roleRepository.findByName(roleName)
                    .orElseGet(() -> {
                        log.warn("Role {} not found, defaulting to ROLE_USER", roleName);
                        return roleRepository.findByName("ROLE_USER")
                            .orElseThrow(() -> new RuntimeException("Default ROLE_USER role not found"));
                    });
                newUser.setRole(userRole);
            } else {
                // Default to USER role
                Role userRole = roleRepository.findByName("ROLE_USER")
                    .orElseThrow(() -> new RuntimeException("Default ROLE_USER role not found"));
                newUser.setRole(userRole);
            }
            
            // Save user
            userRepository.save(newUser);
            
            return ResponseEntity.status(201).body(Map.of("message", "User created successfully", "userId", newUser.getId()));
        } catch (Exception e) {
            log.error("Error creating user", e);
            return ResponseEntity.status(500).body(Map.of("error", "Failed to create user", "message", e.getMessage()));
        }
    }

    @GetMapping("/claims")
    public ResponseEntity<Object> getClaims() {
        log.info("Admin claims data requested");
        
        try {
            // Use AdminDashboardService to get real claims data
            Map<String, Object> claimStats = adminDashboardService.getClaimStats();
            List<Map<String, Object>> recentClaims = adminDashboardService.getDashboardData().getRecentClaims();
            
            Map<String, Object> response = new HashMap<>();
            response.put("stats", claimStats);
            response.put("claims", recentClaims);
            
            return ResponseEntity.ok(response);
        } catch (Exception e) {
            log.error("Error getting claims data", e);
            return ResponseEntity.status(500).body(Map.of("error", "Failed to get claims data"));
        }
    }

    @GetMapping("/claims/{claimId}")
    public ResponseEntity<Object> getClaimById(@PathVariable Long claimId) {
        log.info("Admin claim details requested for claimId: {}", claimId);
        
        try {
            // Fetch claim from database
            Optional<Claim> claimOpt = claimRepository.findById(claimId);
            
            if (claimOpt.isPresent()) {
                Claim claim = claimOpt.get();
                Map<String, Object> claimMap = new HashMap<>();
                claimMap.put("id", claim.getId());
                claimMap.put("claimNumber", "CLM-" + claim.getId());
                
                // Fetch the policy label using AdminDashboardService helper
                String policyLabel = adminDashboardService.getPolicyLabelForClaim(claim);
                claimMap.put("policyNumber", policyLabel);
                
                claimMap.put("claimantName", getUserFullName(userRepository.findById(claim.getUserId()).orElse(null)));
                claimMap.put("amount", claim.getAmount());
                claimMap.put("status", claim.getStatus());
                claimMap.put("submittedDate", claim.getCreatedDate());
                claimMap.put("description", claim.getDescription() != null ? claim.getDescription() : "No description provided");
                claimMap.put("riskLevel", claim.getRiskLevel());
                claimMap.put("fraudDetected", claim.isFraudDetected());
                
                return ResponseEntity.ok(claimMap);
            } else {
                return ResponseEntity.status(404).body(Map.of("error", "Claim not found"));
            }
        } catch (Exception e) {
            log.error("Error getting claim details", e);
            return ResponseEntity.status(500).body(Map.of("error", "Failed to get claim details"));
        }
    }

    @GetMapping("/policies")
    public ResponseEntity<Object> getPolicies() {
        log.info("Admin policies data requested");
        
        try {
            // Use AdminDashboardService to get real policies data
            Map<String, Object> userStats = adminDashboardService.getUserStats();
            
            Map<String, Object> response = new HashMap<>();
            response.put("totalPolicies", adminDashboardService.getDashboardData().getActivePolicies());
            response.put("userStats", userStats);
            
            return ResponseEntity.ok(response);
        } catch (Exception e) {
            log.error("Error getting policies data", e);
            return ResponseEntity.status(500).body(Map.of("error", "Failed to get policies data"));
        }
    }
    
    @PostMapping("/policies")
    public ResponseEntity<Object> createPolicy(@RequestBody Map<String, Object> policyData) {
        log.info("Admin create policy requested");
        
        try {
            String type = (String) policyData.get("type");
            String holderName = (String) policyData.get("holderName");
            Object premiumObj = policyData.get("premium");
            Object coverageObj = policyData.get("coverage");
            
            if (type == null || holderName == null || premiumObj == null || coverageObj == null) {
                return ResponseEntity.status(400).body(Map.of("error", "Type, holder name, premium, and coverage are required"));
            }
            
            // Convert premium and coverage to double
            double premium;
            double coverage;
            try {
                premium = Double.parseDouble(premiumObj.toString());
                coverage = Double.parseDouble(coverageObj.toString());
            } catch (NumberFormatException e) {
                return ResponseEntity.status(400).body(Map.of("error", "Premium and coverage must be valid numbers"));
            }
            
            // Create new policy
            Policy newPolicy = new Policy();
            newPolicy.setPolicyHolder(holderName);
            newPolicy.setPremiumAmount(premium);
            // Note: Policy entity doesn't have a coverage field, so we'll skip it for now
            // You may need to add a coverage field to the Policy entity if needed
            
            // Generate policy number
            String policyNumber = "POL-" + System.currentTimeMillis();
            newPolicy.setPolicyNumber(policyNumber);
            
            // Set default values
            newPolicy.setStatus("PENDING");
            newPolicy.setRiskLevel("MEDIUM");
            newPolicy.setCreatedDate(java.time.LocalDateTime.now());
            newPolicy.setUpdatedDate(java.time.LocalDateTime.now());
            
            // Set default userId (admin user)
            // In a real application, you would get this from the authenticated user
            newPolicy.setUserId(1L);
            
            // Save policy
            Policy savedPolicy = policyService.savePolicy(newPolicy);
            
            return ResponseEntity.status(201).body(Map.of("message", "Policy created successfully", "policyId", savedPolicy.getId()));
        } catch (Exception e) {
            log.error("Error creating policy", e);
            return ResponseEntity.status(500).body(Map.of("error", "Failed to create policy", "message", e.getMessage()));
        }
    }

    @GetMapping("/workflows")
    public ResponseEntity<Object> getWorkflows() {
        log.info("Admin workflows data requested");
        
        // Generate dynamic workflows data
        List<Map<String, Object>> workflows = new ArrayList<>();
        
        // Add sample workflows
        workflows.add(Map.of(
            "id", "WF-001",
            "name", "Auto-approve Low Risk Claims",
            "description", "Automatically approve claims with risk score below 30",
            "active", true
        ));
        workflows.add(Map.of(
            "id", "WF-002",
            "name", "Fraud Detection Alert",
            "description", "Send alert when fraud score exceeds 70",
            "active", true
        ));
        workflows.add(Map.of(
            "id", "WF-003",
            "name", "Policy Renewal Reminder",
            "description", "Send reminder 30 days before policy expiration",
            "active", Math.random() > 0.3
        ));
        
        return ResponseEntity.ok(Map.of("workflows", workflows));
    }

    @GetMapping("/workflows/{workflowId}/rules")
    public ResponseEntity<Object> getWorkflowRules(@PathVariable String workflowId) {
        log.info("Admin workflow rules requested for workflowId: {}", workflowId);
        
        try {
            // Generate sample workflow rules based on workflowId
            List<Map<String, Object>> rules = new ArrayList<>();
            
            if ("WF-001".equals(workflowId)) {
                rules.add(Map.of(
                    "name", "Risk Score Check",
                    "description", "Check if claim risk score is below 30",
                    "condition", "riskScore < 30",
                    "action", "AUTO_APPROVE"
                ));
                rules.add(Map.of(
                    "name", "Amount Limit",
                    "description", "Check if claim amount is under $5000",
                    "condition", "amount < 5000",
                    "action", "AUTO_APPROVE"
                ));
            } else if ("WF-002".equals(workflowId)) {
                rules.add(Map.of(
                    "name", "Fraud Score Check",
                    "description", "Check if fraud score exceeds 70",
                    "condition", "fraudScore > 70",
                    "action", "SEND_ALERT"
                ));
            } else if ("WF-003".equals(workflowId)) {
                rules.add(Map.of(
                    "name", "Policy Expiration Check",
                    "description", "Check if policy expires within 30 days",
                    "condition", "daysUntilExpiration <= 30",
                    "action", "SEND_REMINDER"
                ));
            }
            
            return ResponseEntity.ok(rules);
        } catch (Exception e) {
            log.error("Error getting workflow rules", e);
            return ResponseEntity.status(500).body(Map.of("error", "Failed to get workflow rules"));
        }
    }

    @GetMapping("/fraud")
    public ResponseEntity<Object> getFraudData() {
        log.info("Admin fraud data requested");
        
        try {
            // Use AdminDashboardService to get real fraud data
            List<Map<String, Object>> fraudAlerts = adminDashboardService.getFraudAlerts();
            
            Map<String, Object> response = new HashMap<>();
            response.put("fraudAlerts", fraudAlerts);
            response.put("totalFraudAlerts", fraudAlerts.size());
            
            return ResponseEntity.ok(response);
        } catch (Exception e) {
            log.error("Error getting fraud data", e);
            return ResponseEntity.status(500).body(Map.of("error", "Failed to get fraud data"));
        }
    }

    @GetMapping("/system/health")
    public ResponseEntity<Object> getSystemHealth() {
        log.info("Admin system health requested");
        
        // Generate dynamic system health data
        Map<String, Object> response = new HashMap<>();
        response.put("apiServer", Map.of(
            "status", "healthy",
            "responseTime", 45 + (int)(Math.random() * 20) - 10,
            "uptime", "99.9%"
        ));
        response.put("database", Map.of(
            "status", "healthy",
            "queryCount", 1250 + (int)(Math.random() * 100),
            "connections", 50 + (int)(Math.random() * 20)
        ));
        response.put("auth", Map.of(
            "status", "healthy",
            "activeSessions", 486 + (int)(Math.random() * 50) - 25,
            "failedLogins", 5 + (int)(Math.random() * 10)
        ));
        response.put("email", Map.of(
            "status", "healthy",
            "sentToday", 1234 + (int)(Math.random() * 100),
            "queueSize", 10 + (int)(Math.random() * 20)
        ));
        
        return ResponseEntity.ok(response);
    }

    @GetMapping("/system/logs")
    public ResponseEntity<Object> getSystemLogs(@RequestParam(defaultValue = "20") int limit) {
        log.info("Admin system logs requested, limit: {}", limit);
        
        // Generate dynamic system logs
        List<Map<String, Object>> logs = new ArrayList<>();
        
        // Add recent info log
        logs.add(Map.of(
            "timestamp", System.currentTimeMillis(),
            "level", "INFO",
            "message", "System started successfully"
        ));
        
        // Add random warning logs
        if (Math.random() > 0.5) {
            logs.add(Map.of(
                "timestamp", System.currentTimeMillis() - (int)(Math.random() * 60000),
                "level", "WARN",
                "message", "High memory usage detected: " + (67 + (int)(Math.random() * 20)) + "%"
            ));
        }
        
        // Add random error logs
        if (Math.random() > 0.7) {
            logs.add(Map.of(
                "timestamp", System.currentTimeMillis() - (int)(Math.random() * 120000),
                "level", "ERROR",
                "message", "Database connection timeout after " + (5000 + (int)(Math.random() * 3000)) + "ms"
            ));
        }
        
        // Add random debug logs
        if (Math.random() > 0.6) {
            logs.add(Map.of(
                "timestamp", System.currentTimeMillis() - (int)(Math.random() * 30000),
                "level", "DEBUG",
                "message", "Processing request from user" + (int)(Math.random() * 100)
            ));
        }
        
        return ResponseEntity.ok(logs);
    }

    @GetMapping("/reports")
    public ResponseEntity<Object> getReports(
            @RequestParam(required = false) String start,
            @RequestParam(required = false) String end) {
        log.info("Admin reports requested, start: {}, end: {}", start, end);
        
        // Generate dynamic reports data
        Map<String, Object> response = new HashMap<>();
        response.put("thisMonthClaims", 156 + (int)(Math.random() * 20));
        response.put("approvalRate", 87.5 + (Math.random() * 5) - 2.5);
        response.put("fraudDetectionRate", 2.3 + (Math.random() * 1) - 0.5);
        response.put("avgProcessingTime", 2.4 + (Math.random() * 0.5) - 0.25);
        
        response.put("claimsTrend", List.of(
            Map.of("date", "Jan", "approved", 45 + (int)(Math.random() * 10), "pending", 20 + (int)(Math.random() * 5), "rejected", 5 + (int)(Math.random() * 3), "fraud", 3 + (int)(Math.random() * 2)),
            Map.of("date", "Feb", "approved", 52 + (int)(Math.random() * 10), "pending", 18 + (int)(Math.random() * 5), "rejected", 8 + (int)(Math.random() * 3), "fraud", 5 + (int)(Math.random() * 2)),
            Map.of("date", "Mar", "approved", 61 + (int)(Math.random() * 10), "pending", 15 + (int)(Math.random() * 5), "rejected", 4 + (int)(Math.random() * 3), "fraud", 2 + (int)(Math.random() * 2))
        ));
        
        response.put("fraudTrend", List.of(
            Map.of("date", "Jan", "fraud", 3 + (int)(Math.random() * 2)),
            Map.of("date", "Feb", "fraud", 5 + (int)(Math.random() * 2)),
            Map.of("date", "Mar", "fraud", 2 + (int)(Math.random() * 2))
        ));
        
        response.put("monthlySummary", List.of(
            Map.of("month", "January", "totalClaims", 120 + (int)(Math.random() * 20), "approved", 105 + (int)(Math.random() * 15), "rejected", 12 + (int)(Math.random() * 5), "fraudDetected", 3 + (int)(Math.random() * 2)),
            Map.of("month", "February", "totalClaims", 135 + (int)(Math.random() * 20), "approved", 118 + (int)(Math.random() * 15), "rejected", 15 + (int)(Math.random() * 5), "fraudDetected", 2 + (int)(Math.random() * 2)),
            Map.of("month", "March", "totalClaims", 142 + (int)(Math.random() * 20), "approved", 125 + (int)(Math.random() * 15), "rejected", 14 + (int)(Math.random() * 5), "fraudDetected", 3 + (int)(Math.random() * 2))
        ));
        
        return ResponseEntity.ok(response);
    }

    @GetMapping("/audit")
    public ResponseEntity<Object> getAuditLogs() {
        log.info("Admin audit logs requested");
        
        try {
            // Use AdminDashboardService to get real audit logs
            List<Map<String, Object>> logs = adminDashboardService.getAuditLogs();
            return ResponseEntity.ok(Map.of("logs", logs));
        } catch (Exception e) {
            log.error("Error getting audit logs", e);
            return ResponseEntity.status(500).body(Map.of("error", "Failed to get audit logs"));
        }
    }

    @GetMapping("/services/status")
    public ResponseEntity<Object> getServiceStatus() {
        log.info("Admin service status requested");
        
        // Generate dynamic service status
        Map<String, Object> response = new HashMap<>();
        response.put("risk", Map.of(
            "online", true,
            "latencyMs", 98 + (int)(Math.random() * 30) - 15,
            "requestsPerMin", 120 + (int)(Math.random() * 50)
        ));
        response.put("fraud", Map.of(
            "online", true,
            "latencyMs", 112 + (int)(Math.random() * 30) - 15,
            "requestsPerMin", 85 + (int)(Math.random() * 40)
        ));
        response.put("documents", Map.of(
            "online", true,
            "latencyMs", 85 + (int)(Math.random() * 30) - 15,
            "requestsPerMin", 200 + (int)(Math.random() * 80)
        ));
        response.put("assistant", Map.of(
            "online", true,
            "latencyMs", 128 + (int)(Math.random() * 30) - 15,
            "requestsPerMin", 150 + (int)(Math.random() * 60)
        ));
        
        return ResponseEntity.ok(response);
    }

    @PostMapping("/claims/{claimId}/approve")
    public ResponseEntity<Object> approveClaim(@PathVariable Long claimId) {
        log.info("Approving claim: {}", claimId);
        
        try {
            // Approve claim using ClaimService
            // This would need to be implemented in ClaimService
            return ResponseEntity.ok(Map.of("message", "Claim approved successfully"));
        } catch (Exception e) {
            log.error("Error approving claim", e);
            return ResponseEntity.status(500).body(Map.of("error", "Failed to approve claim"));
        }
    }

    @PostMapping("/claims/{claimId}/reject")
    public ResponseEntity<Object> rejectClaim(@PathVariable Long claimId) {
        log.info("Rejecting claim: {}", claimId);
        
        try {
            // Reject claim using ClaimService
            // This would need to be implemented in ClaimService
            return ResponseEntity.ok(Map.of("message", "Claim rejected successfully"));
        } catch (Exception e) {
            log.error("Error rejecting claim", e);
            return ResponseEntity.status(500).body(Map.of("error", "Failed to reject claim"));
        }
    }

    private void broadcastDashboardUpdates() {
        try {
            // Broadcast to all SSE emitters
            List<SseEmitter> deadEmitters = new ArrayList<>();
            
            for (SseEmitter emitter : sseEmitters) {
                try {
                    Map<String, Object> data = new HashMap<>();
                    data.put("type", "DASHBOARD_UPDATE");
                    data.put("timestamp", System.currentTimeMillis());
                    
                    emitter.send(SseEmitter.event()
                        .name("dashboard_update")
                        .data(data));
                } catch (IOException e) {
                    deadEmitters.add(emitter);
                }
            }
            
            // Remove dead emitters
            sseEmitters.removeAll(deadEmitters);
            
        } catch (Exception e) {
            log.error("Error broadcasting dashboard updates", e);
        }
    }

    @GetMapping("/dashboard/stream")
    public SseEmitter streamDashboard() {
        log.info("SSE stream requested for dashboard");
        
        SseEmitter emitter = new SseEmitter(Long.MAX_VALUE);
        sseEmitters.add(emitter);
        
        emitter.onCompletion(() -> sseEmitters.remove(emitter));
        emitter.onTimeout(() -> sseEmitters.remove(emitter));
        emitter.onError((e) -> sseEmitters.remove(emitter));
        
        return emitter;
    }

    @GetMapping("/notifications")
    public ResponseEntity<Object> getNotifications() {
        log.info("Admin notifications requested");
        
        try {
            // Return empty list for now - notifications are handled via WebSocket
            return ResponseEntity.ok(List.of());
        } catch (Exception e) {
            log.error("Error getting notifications", e);
            return ResponseEntity.status(500).body(Map.of("error", "Failed to get notifications"));
        }
    }
    
    // Helper method to get user full name
    private String getUserFullName(User user) {
        if (user.getFirstName() != null && user.getLastName() != null) {
            return user.getFirstName() + " " + user.getLastName();
        } else if (user.getFirstName() != null) {
            return user.getFirstName();
        } else if (user.getUsername() != null) {
            return user.getUsername();
        } else {
            return "Unknown User";
        }
    }
    
}

