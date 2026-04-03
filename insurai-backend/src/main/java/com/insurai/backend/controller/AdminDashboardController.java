package com.insurai.backend.controller;

import com.insurai.backend.dto.AdminDashboardDTO;
import com.insurai.backend.dto.SystemMetricsDTO;
import com.insurai.backend.model.ApiResponse;
import com.insurai.backend.service.AdminDashboardService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.servlet.mvc.method.annotation.SseEmitter;

import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/admin")
@CrossOrigin(origins = "*")
public class AdminDashboardController {

    @Autowired
    private AdminDashboardService adminDashboardService;

    /**
     * Get comprehensive admin dashboard data
     */
    @GetMapping("/dashboard-data")
    public ResponseEntity<ApiResponse<AdminDashboardDTO>> getDashboardData() {
        try {
            AdminDashboardDTO dashboardData = adminDashboardService.getDashboardData();
            return ResponseEntity.ok(
                ApiResponse.success(dashboardData, "Dashboard data retrieved successfully")
            );
        } catch (Exception e) {
            return ResponseEntity.badRequest()
                .body(ApiResponse.error("Failed to retrieve dashboard data: " + e.getMessage()));
        }
    }

    /**
     * Get system metrics for real-time updates
     */
    @GetMapping("/system-metrics")
    public ResponseEntity<ApiResponse<SystemMetricsDTO>> getSystemMetrics() {
        try {
            SystemMetricsDTO metrics = adminDashboardService.getSystemMetrics();
            return ResponseEntity.ok(
                ApiResponse.success(metrics, "System metrics retrieved successfully")
            );
        } catch (Exception e) {
            return ResponseEntity.badRequest()
                .body(ApiResponse.error("Failed to retrieve system metrics: " + e.getMessage()));
        }
    }

    /**
     * Get recent activity feed
     */
    @GetMapping("/activity-feed")
    public ResponseEntity<ApiResponse<List<Map<String, Object>>>> getActivityFeed() {
        try {
            List<Map<String, Object>> activityFeed = adminDashboardService.getActivityFeed();
            return ResponseEntity.ok(
                ApiResponse.success(activityFeed, "Activity feed retrieved successfully")
            );
        } catch (Exception e) {
            return ResponseEntity.badRequest()
                .body(ApiResponse.error("Failed to retrieve activity feed: " + e.getMessage()));
        }
    }

    /**
     * Get fraud alerts
     */
    @GetMapping("/fraud-alerts")
    public ResponseEntity<ApiResponse<List<Map<String, Object>>>> getFraudAlerts() {
        try {
            List<Map<String, Object>> fraudAlerts = adminDashboardService.getFraudAlerts();
            return ResponseEntity.ok(
                ApiResponse.success(fraudAlerts, "Fraud alerts retrieved successfully")
            );
        } catch (Exception e) {
            return ResponseEntity.badRequest()
                .body(ApiResponse.error("Failed to retrieve fraud alerts: " + e.getMessage()));
        }
    }

    /**
     * Get claim statistics
     */
    @GetMapping("/claim-stats")
    public ResponseEntity<ApiResponse<Map<String, Object>>> getClaimStats() {
        try {
            Map<String, Object> claimStats = adminDashboardService.getClaimStats();
            return ResponseEntity.ok(
                ApiResponse.success(claimStats, "Claim statistics retrieved successfully")
            );
        } catch (Exception e) {
            return ResponseEntity.badRequest()
                .body(ApiResponse.error("Failed to retrieve claim statistics: " + e.getMessage()));
        }
    }

    /**
     * Get user statistics
     */
    @GetMapping("/user-stats")
    public ResponseEntity<ApiResponse<Map<String, Object>>> getUserStats() {
        try {
            Map<String, Object> userStats = adminDashboardService.getUserStats();
            return ResponseEntity.ok(
                ApiResponse.success(userStats, "User statistics retrieved successfully")
            );
        } catch (Exception e) {
            return ResponseEntity.badRequest()
                .body(ApiResponse.error("Failed to retrieve user statistics: " + e.getMessage()));
        }
    }

    /**
     * Get audit logs
     */
    @GetMapping("/audit-logs")
    public ResponseEntity<ApiResponse<List<Map<String, Object>>>> getAuditLogs() {
        try {
            List<Map<String, Object>> auditLogs = adminDashboardService.getAuditLogs();
            return ResponseEntity.ok(
                ApiResponse.success(auditLogs, "Audit logs retrieved successfully")
            );
        } catch (Exception e) {
            return ResponseEntity.badRequest()
                .body(ApiResponse.error("Failed to retrieve audit logs: " + e.getMessage()));
        }
    }

    /**
     * SSE endpoint for real-time dashboard updates
     */
    @GetMapping("/dashboard-updates")
    public SseEmitter getDashboardUpdates(@RequestHeader("Authorization") String authHeader) {
        try {
            // Extract token from Authorization header
            String token = authHeader.replace("Bearer ", "");
            
            // Validate token (you might want to add proper JWT validation here)
            if (token == null || token.isEmpty()) {
                throw new RuntimeException("Invalid or missing authentication token");
            }

            // Create SSE emitter with 30-minute timeout
            SseEmitter emitter = new SseEmitter(30 * 60 * 1000L);

            // Send initial data
            AdminDashboardDTO initialData = adminDashboardService.getDashboardData();
            emitter.send(SseEmitter.event()
                .name("dashboard_update")
                .data(initialData));

            // Register emitter for real-time updates
            adminDashboardService.registerEmitter(emitter);

            // Handle completion and errors
            emitter.onCompletion(() -> {
                adminDashboardService.unregisterEmitter(emitter);
                System.out.println("Admin dashboard SSE connection completed");
            });

            emitter.onError((ex) -> {
                adminDashboardService.unregisterEmitter(emitter);
                System.err.println("Admin dashboard SSE connection error: " + ex.getMessage());
            });

            emitter.onTimeout(() -> {
                adminDashboardService.unregisterEmitter(emitter);
                emitter.complete();
                System.out.println("Admin dashboard SSE connection timed out");
            });

            return emitter;

        } catch (Exception e) {
            System.err.println("Failed to create SSE connection: " + e.getMessage());
            return null;
        }
    }

    /**
     * Manual trigger for dashboard updates (for testing)
     */
    @PostMapping("/trigger-update")
    public ResponseEntity<ApiResponse<String>> triggerUpdate() {
        try {
            adminDashboardService.broadcastUpdate();
            return ResponseEntity.ok(
                ApiResponse.success("Update triggered successfully", "Dashboard update broadcasted")
            );
        } catch (Exception e) {
            return ResponseEntity.badRequest()
                .body(ApiResponse.error("Failed to trigger update: " + e.getMessage()));
        }
    }
}