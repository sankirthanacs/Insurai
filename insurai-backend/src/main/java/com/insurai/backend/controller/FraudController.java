package com.insurai.backend.controller;

import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.Arrays;
import java.util.HashMap;
import java.util.List;
import java.util.Map;

import org.springframework.data.domain.PageRequest;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import com.insurai.backend.entity.Claim;

@RestController
@RequestMapping({"/api/admin/fraud", "/api/ai/fraud-alerts", "/api/agent/fraud-trends"})
public class FraudController {

    private final com.insurai.backend.repository.ClaimRepository claimRepository;

    public FraudController(com.insurai.backend.repository.ClaimRepository claimRepository) {
        this.claimRepository = claimRepository;
    }

    @GetMapping
    public List<Map<String, Object>> getFraudData() {
List<Claim> fraudClaims = claimRepository
        .findByFraudDetected(true, PageRequest.of(0, 50))
        .getContent();
        List<Map<String, Object>> fraudData = new ArrayList<>();
        fraudClaims.forEach(claim -> {
            Map<String, Object> fraud = new HashMap<>();
            fraud.put("id", claim.getId());
            fraud.put("claimId", "CLM-" + String.format("%03d", claim.getId()));
            fraud.put("claimant", "User #" + claim.getUserId());
            fraud.put("claimAmount", claim.getAmount());
            fraud.put("riskScore", claim.getRiskLevel() != null ? claim.getRiskLevel() : "UNKNOWN");
            fraud.put("status", claim.getStatus());
            fraud.put("riskFactors", Arrays.asList("High risk score", "Manual validation required"));
            fraud.put("detectionDate", claim.getUpdatedDate() != null ? claim.getUpdatedDate() : claim.getCreatedDate());
            fraudData.add(fraud);
        });

        return fraudData;
    }

    @GetMapping("/{id}")
    public Map<String, Object> getFraudById(@PathVariable Long id) {
        Map<String, Object> fraud = new HashMap<>();
        fraud.put("id", id);
        fraud.put("claimId", "CLM-" + String.format("%03d", id));
        fraud.put("claimant", "Claimant " + id);
        fraud.put("claimAmount", 50000 + (id * 10000));
        fraud.put("riskScore", 60 + (id * 5));
        fraud.put("status", id % 2 == 0 ? "Detected" : "Under Review");
        fraud.put("riskFactors", Arrays.asList("Risk Factor 1", "Risk Factor 2"));
        return fraud;
    }

    @PostMapping("/{id}/review")
    public Map<String, Object> reviewFraud(@PathVariable Long id, @RequestBody Map<String, Object> reviewData) {
        Map<String, Object> response = new HashMap<>();
        response.put("id", id);
        response.put("status", reviewData.getOrDefault("status", "Reviewed"));
        response.put("reviewedAt", LocalDateTime.now());
        response.put("reviewer", reviewData.getOrDefault("reviewer", "Admin"));
        response.put("notes", reviewData.getOrDefault("notes", ""));
        return response;
    }
}
