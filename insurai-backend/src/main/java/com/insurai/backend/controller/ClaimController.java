package com.insurai.backend.controller;

import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

import java.util.Map;

import com.insurai.backend.dto.ClaimDTO;
import com.insurai.backend.dto.UnderwriterDecisionDTO;
import com.insurai.backend.entity.Claim;
import com.insurai.backend.service.ClaimService;

@RestController
@RequestMapping("/api/claims")
public class ClaimController {

    private final ClaimService claimService;

    public ClaimController(ClaimService claimService) {
        this.claimService = claimService;
    }

    // ✅ PAGINATION FIX
    @GetMapping
    public Page<Claim> getAllClaims(Pageable pageable) {
        return claimService.getAllClaims(pageable);
    }

    // ✅ USER CLAIMS (optimized)
    @GetMapping("/user")
    public ResponseEntity<Page<Claim>> getUserClaims(
            Authentication authentication,
            Pageable pageable) {

        if (authentication == null || !authentication.isAuthenticated()) {
            return ResponseEntity.status(401).build();
        }

        // 👉 Better: get userId from JWT (future improvement)
        String userEmail = authentication.getName();

        // TEMP: still using email → but service should convert efficiently
        Page<Claim> claims = claimService.getUserClaimsByEmail(userEmail, pageable);

        return ResponseEntity.ok(claims);
    }

    @GetMapping("/{id}")
    public ResponseEntity<Claim> getClaimById(@PathVariable Long id) {
        return claimService.getClaimById(id)
                .map(ResponseEntity::ok)
                .orElse(ResponseEntity.notFound().build());
    }

    // ✅ SUBMIT CLAIM (clean)
    @PostMapping("/submit")
    public ResponseEntity<Claim> submitClaim(
            @RequestBody ClaimDTO claimDTO,
            Authentication authentication) {

        if (authentication == null || !authentication.isAuthenticated()) {
            return ResponseEntity.status(401).build();
        }

        String userEmail = authentication.getName();

        Claim claim = claimService.submitClaimByEmail(claimDTO, userEmail);

        return ResponseEntity.ok(claim);
    }

    @PutMapping("/{id}")
    public ResponseEntity<Claim> updateClaim(
            @PathVariable Long id,
            @RequestBody ClaimDTO claimDTO) {

        return ResponseEntity.ok(claimService.updateClaim(id, claimDTO));
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Void> deleteClaim(@PathVariable Long id) {
        claimService.deleteClaim(id);
        return ResponseEntity.noContent().build();
    }

    // ✅ UNDERWRITER (paginated)
    @GetMapping("/underwriter")
    @PreAuthorize("hasRole('UNDERWRITER')")
    public ResponseEntity<Page<Claim>> getUnderwriterClaims(Pageable pageable) {
        return ResponseEntity.ok(claimService.getAllClaims(pageable));
    }

    @GetMapping("/high-risk")
    public ResponseEntity<Page<Claim>> getHighRiskClaims(Pageable pageable) {
        return ResponseEntity.ok(claimService.getHighRiskClaims(pageable));
    }

    // ✅ APPROVE
    @PutMapping("/{id}/approve")
    public ResponseEntity<Claim> approveClaim(
            @PathVariable Long id,
            @RequestBody UnderwriterDecisionDTO decision,
            Authentication authentication) {

        if (!hasUnderwriterRole(authentication)) {
            return ResponseEntity.status(403).build();
        }

        return ResponseEntity.ok(
                claimService.approveClaim(id, decision.getNotes())
        );
    }

    // ✅ REJECT
    @PutMapping("/{id}/reject")
    public ResponseEntity<Claim> rejectClaim(
            @PathVariable Long id,
            @RequestBody UnderwriterDecisionDTO decision,
            Authentication authentication) {

        if (!hasUnderwriterRole(authentication)) {
            return ResponseEntity.status(403).build();
        }

        return ResponseEntity.ok(
                claimService.rejectClaim(id, decision.getNotes())
        );
    }

    // ✅ DECISION
    @PostMapping("/{id}/decision")
    public ResponseEntity<?> submitUnderwriterDecision(
            @PathVariable Long id,
            @RequestBody Map<String, Object> payload,
            Authentication authentication) {

        if (!hasUnderwriterRole(authentication)) {
            return ResponseEntity.status(403)
                    .body(Map.of("error", "Underwriter role required"));
        }

        String decision = String.valueOf(payload.get("decision"));
        String notes = payload.getOrDefault("notes", "").toString();

        try {
            return ResponseEntity.ok(
                    claimService.submitUnderwriterDecision(id, decision, notes)
            );
        } catch (Exception e) {
            String message = e.getMessage() != null ? e.getMessage() : "Failed to process decision";
            return ResponseEntity.badRequest().body(Map.of("error", message));
        }
    }

    // ✅ CLEAN ROLE CHECK
    private boolean hasUnderwriterRole(Authentication authentication) {
        return authentication != null &&
                authentication.getAuthorities().stream()
                        .anyMatch(auth ->
                                "ROLE_UNDERWRITER".equalsIgnoreCase(auth.getAuthority()) ||
                                "UNDERWRITER".equalsIgnoreCase(auth.getAuthority()));
    }
}