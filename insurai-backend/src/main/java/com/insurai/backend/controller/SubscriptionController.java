package com.insurai.backend.controller;

import java.math.BigDecimal;
import java.util.Map;

import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import com.insurai.backend.entity.Subscription;
import com.insurai.backend.service.SubscriptionService;

@RestController
@RequestMapping("/api/subscription")
public class SubscriptionController {

    private final SubscriptionService subscriptionService;

    public SubscriptionController(SubscriptionService subscriptionService) {
        this.subscriptionService = subscriptionService;
    }

    @PostMapping("/cancel")
    public ResponseEntity<Subscription> cancelSubscription(Authentication authentication) {
        String userEmail = authentication.getName();
        Subscription updated = subscriptionService.cancelSubscription(userEmail);
        return ResponseEntity.ok(updated);
    }

    @PostMapping("/upgrade")
    public ResponseEntity<Subscription> upgradePlan(
            @RequestBody Map<String, String> request,
            Authentication authentication) {
        String userEmail = authentication.getName();
        String newPlan = request.get("plan");
        String costString = request.getOrDefault("cost", "29.99");
        BigDecimal cost = new BigDecimal(costString.replaceAll("[^0-9.]+", ""));
        Subscription updated = subscriptionService.upgradeSubscription(userEmail, newPlan, cost);
        return ResponseEntity.ok(updated);
    }

    @GetMapping("/current")
    public ResponseEntity<Subscription> getCurrentSubscription(Authentication authentication) {
        String userEmail = authentication.getName();
        Subscription current = subscriptionService.getOrCreateSubscriptionForUser(userEmail);
        return ResponseEntity.ok(current);
    }
}
