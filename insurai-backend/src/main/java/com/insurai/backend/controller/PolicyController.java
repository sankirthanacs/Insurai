package com.insurai.backend.controller;

import java.util.List;

import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import com.insurai.backend.entity.Policy;
import com.insurai.backend.entity.User;
import com.insurai.backend.repository.UserRepository;
import com.insurai.backend.service.PolicyService;

@RestController
@RequestMapping("/api/policies")
public class PolicyController {

    private final PolicyService service;
    private final UserRepository userRepository;

    public PolicyController(PolicyService service, UserRepository userRepository) {
        this.service = service;
        this.userRepository = userRepository;
    }

    @GetMapping
    public List<Policy> getPolicies() {
        return service.getAllPolicies();
    }

    @GetMapping("/my-policies")
    public List<Policy> getMyPolicies(Authentication authentication) {
        String userEmail = authentication.getName();
        User user = userRepository.findByEmail(userEmail)
            .orElseThrow(() -> new RuntimeException("User not found: " + userEmail));

        List<Policy> policies = service.getPoliciesByUserId(user.getId());

        // Do not seed fake policies in production. Return empty list if no policies exist.
        return policies == null ? List.of() : policies;
    }

    @PostMapping
    public Policy createPolicy(@RequestBody Policy policy) {
        return service.savePolicy(policy);
    }

    // Underwriter-specific endpoints
    @GetMapping("/all")
    public ResponseEntity<List<Policy>> getAllPoliciesForReview(Authentication authentication) {
        return ResponseEntity.ok(service.getAllPolicies());
    }

    @GetMapping("/review")
    public ResponseEntity<List<Policy>> getPoliciesForReview(Authentication authentication) {
        return ResponseEntity.ok(service.getPoliciesForReview());
    }

    @PostMapping("/{policyId}/approve")
    public ResponseEntity<Policy> approvePolicy(@PathVariable Long policyId) {
        Policy approvedPolicy = service.approvePolicy(policyId);
        return ResponseEntity.ok(approvedPolicy);
    }

    @PostMapping("/{policyId}/reject")
    public ResponseEntity<Policy> rejectPolicy(@PathVariable Long policyId) {
        Policy rejectedPolicy = service.rejectPolicy(policyId);
        return ResponseEntity.ok(rejectedPolicy);
    }
}
