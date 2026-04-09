package com.insurai.backend.controller;

import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.Arrays;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.stream.Collectors;

import org.springframework.data.domain.PageRequest;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import com.insurai.backend.entity.Claim;
import com.insurai.backend.repository.ClaimRepository;

@RestController
@RequestMapping("/api/ai/insights")
public class AiInsightsController {

    private final ClaimRepository claimRepository;

    public AiInsightsController(ClaimRepository claimRepository) {
        this.claimRepository = claimRepository;
    }

    @GetMapping
    public List<Map<String, Object>> getAiInsights() {
        List<Claim> allClaims = claimRepository.findAll();
        List<Map<String, Object>> insights = new ArrayList<>();

        if (allClaims.isEmpty()) {
            insights.add(createInsight("info", "no-data", "No Claims Data Available", 
                "No claims have been submitted yet. AI insights will appear once claims data is available.",
                "low", "info"));
            return insights;
        }

        // Calculate statistics
        long totalClaims = allClaims.size();
        long pendingClaims = allClaims.stream().filter(c -> "PENDING".equalsIgnoreCase(c.getStatus())).count();
        long approvedClaims = allClaims.stream().filter(c -> "APPROVED".equalsIgnoreCase(c.getStatus())).count();
        long rejectedClaims = allClaims.stream().filter(c -> "REJECTED".equalsIgnoreCase(c.getStatus())).count();
        long fraudClaims = allClaims.stream().filter(Claim::isFraudDetected).count();
        
        double avgClaimAmount = allClaims.stream()
            .filter(c -> c.getAmount() != null)
            .mapToDouble(c -> c.getAmount().doubleValue())
            .average()
            .orElse(0);

        // High-risk claims analysis
        List<Claim> highRiskClaims = allClaims.stream()
            .filter(c -> c.getRiskLevel() != null && 
                (c.getRiskLevel().equals("HIGH") || c.getRiskLevel().equals("CRITICAL")))
            .collect(Collectors.toList());

        // Pending claims older than 7 days
        LocalDateTime sevenDaysAgo = LocalDateTime.now().minusDays(7);
        List<Claim> oldPendingClaims = allClaims.stream()
            .filter(c -> "PENDING".equalsIgnoreCase(c.getStatus()))
            .filter(c -> c.getCreatedDate() != null && c.getCreatedDate().isBefore(sevenDaysAgo))
            .collect(Collectors.toList());

        // Insight 1: Fraud Alert
        if (fraudClaims > 0) {
            double fraudRate = (fraudClaims * 100.0) / totalClaims;
            String severity = fraudRate > 5 ? "urgent" : "warning";
            String priority = fraudRate > 5 ? "high" : "medium";
            
            insights.add(createInsight(severity, "fraud-alert", "Fraud Activity Detected", 
                String.format("%.1f%% fraud rate detected across claims (%d flagged). Immediate review recommended for suspicious patterns.", fraudRate, fraudClaims),
                priority, "fraud"));
        }

        // Insight 2: High Risk Claims
        if (!highRiskClaims.isEmpty()) {
            insights.add(createInsight("warning", "high-risk", "High-Risk Claim Pattern", 
                String.format("%d claims flagged as HIGH/CRITICAL risk. Consider implementing enhanced verification procedures.", highRiskClaims.size()),
                "medium", "risk"));
        }

        // Insight 3: Claims Backlog
        if (pendingClaims > totalClaims * 0.2) {
            double pendingRate = (pendingClaims * 100.0) / totalClaims;
            insights.add(createInsight("warning", "backlog", "Claims Backlog Detected", 
                String.format("%.1f%% of claims (%d) are pending review. Consider prioritizing high-risk cases to reduce backlog.", pendingRate, pendingClaims),
                "medium", "backlog"));
        }

        // Insight 4: Old Pending Claims
        if (!oldPendingClaims.isEmpty()) {
            insights.add(createInsight("urgent", "old-pending", "Stale Pending Claims", 
                String.format("%d pending claims are older than 7 days. Urgent action required to prevent SLA violations.", oldPendingClaims.size()),
                "high", "delay"));
        }

        // Insight 5: Approval Rate Anomaly
        double approvalRate = totalClaims > 0 ? (approvedClaims * 100.0) / totalClaims : 0;
        if (approvalRate > 95) {
            insights.add(createInsight("warning", "approval-anomaly", "Unusually High Approval Rate", 
                String.format("Approval rate is %.1f%%, which is above normal threshold. Consider reviewing approval criteria.", approvalRate),
                "low", "anomaly"));
        } else if (approvalRate < 50) {
            insights.add(createInsight("warning", "rejection-anomaly", "High Rejection Rate", 
                String.format("Approval rate is only %.1f%%. Review rejection reasons for potential process improvements.", approvalRate),
                "medium", "anomaly"));
        }

        // Insight 6: Average Claim Amount
        if (avgClaimAmount > 100000) {
            insights.add(createInsight("info", "high-amount", "High Average Claim Amount", 
                String.format("Average claim amount is ₹%.0f, which is significantly higher than typical. Monitor for potential fraud indicators.", avgClaimAmount),
                "low", "financial"));
        }

        // Insight 7: Positive trend
        if (insights.isEmpty()) {
            insights.add(createInsight("info", "normal", "No Critical Issues Detected", 
                "Current claims show normal risk patterns. All KPIs are within acceptable ranges. Continue monitoring.",
                "low", "info"));
        }

        // Sort by priority
        final Map<String, Integer> priorityOrder = Map.of("high", 0, "medium", 1, "low", 2);
        insights.sort((a, b) -> {
            String p1 = (String) a.getOrDefault("priority", "low");
            String p2 = (String) b.getOrDefault("priority", "low");
            return priorityOrder.getOrDefault(p1, 2).compareTo(priorityOrder.getOrDefault(p2, 2));
        });

        return insights;
    }

    @GetMapping("/summary")
    public Map<String, Object> getInsightsSummary() {
        List<Claim> allClaims = claimRepository.findAll();
        
        long totalClaims = allClaims.size();
        long pendingClaims = allClaims.stream().filter(c -> "PENDING".equalsIgnoreCase(c.getStatus())).count();
        long fraudClaims = allClaims.stream().filter(Claim::isFraudDetected).count();
        long highRiskClaims = allClaims.stream()
            .filter(c -> c.getRiskLevel() != null && 
                (c.getRiskLevel().equals("HIGH") || c.getRiskLevel().equals("CRITICAL")))
            .count();

        Map<String, Object> summary = new HashMap<>();
        summary.put("totalClaims", totalClaims);
        summary.put("pendingClaims", pendingClaims);
        summary.put("fraudClaims", fraudClaims);
        summary.put("highRiskClaims", highRiskClaims);
        summary.put("insightsCount", getAiInsights().size());
        summary.put("lastUpdated", LocalDateTime.now().toString());

        return summary;
    }

    @PostMapping("/{id}/acknowledge")
    public Map<String, Object> acknowledgeInsight(@PathVariable String id, @RequestBody Map<String, Object> data) {
        Map<String, Object> response = new HashMap<>();
        response.put("insightId", id);
        response.put("acknowledged", true);
        response.put("acknowledgedAt", LocalDateTime.now());
        response.put("acknowledgedBy", data.getOrDefault("user", "System"));
        response.put("notes", data.getOrDefault("notes", ""));
        return response;
    }

    private Map<String, Object> createInsight(String type, String id, String title, String message, String priority, String category) {
        Map<String, Object> insight = new HashMap<>();
        insight.put("id", id);
        insight.put("type", type);
        insight.put("title", title);
        insight.put("message", message);
        insight.put("priority", priority);
        insight.put("category", category);
        insight.put("timestamp", LocalDateTime.now().toString());
        insight.put("acknowledged", false);
        
        // Add metadata
        Map<String, Object> metadata = new HashMap<>();
        metadata.put("source", "AI Claims Analysis");
        metadata.put("model", "InsurAI-v1");
        insight.put("metadata", metadata);
        
        return insight;
    }
}
