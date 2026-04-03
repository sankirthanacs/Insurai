package com.insurai.backend.service;

import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import com.insurai.backend.DashboardWebSocketHandler;
import com.insurai.backend.entity.Notification;
import com.insurai.backend.entity.Policy;
import com.insurai.backend.entity.User;
import com.insurai.backend.repository.PolicyRepository;
import com.insurai.backend.repository.UserRepository;

@Service
public class PolicyService {

    private final PolicyRepository repository;

    @Autowired
    private DashboardWebSocketHandler dashboardWebSocketHandler;

    @Autowired
    private NotificationService notificationService;

    @Autowired
    private UserRepository userRepository;

    public PolicyService(PolicyRepository repository) {
        this.repository = repository;
    }

    public List<Policy> getAllPolicies() {
        return repository.findAll();
    }

    public List<Policy> getPoliciesByUserId(Long userId) {
        return repository.findByUserId(userId);
    }

    public Policy savePolicy(Policy policy) {
        // Set default status if not provided
        if (policy.getStatus() == null || policy.getStatus().isEmpty()) {
            policy.setStatus("PENDING");
        }
        
        // Set default risk level if not provided
        if (policy.getRiskLevel() == null || policy.getRiskLevel().isEmpty()) {
            double premium = policy.getPremiumAmount();
            if (premium > 10000) {
                policy.setRiskLevel("HIGH");
            } else if (premium > 5000) {
                policy.setRiskLevel("MEDIUM");
            } else {
                policy.setRiskLevel("LOW");
            }
        }
        
        Policy savedPolicy = repository.save(policy);

        // Send WebSocket notification for real-time update
        try {
            String policyId = "POL-" + savedPolicy.getId();
            String message = String.format(
                "{\"type\":\"policySubmitted\",\"policyId\":\"%s\",\"userId\":%d}",
                policyId, savedPolicy.getUserId()
            );
            dashboardWebSocketHandler.broadcastMessage(message);
        } catch (Exception e) {
            System.err.println("Failed to send WebSocket notification: " + e.getMessage());
        }

        // Create and send notification via SSE
        try {
            User user = userRepository.findById(savedPolicy.getUserId()).orElse(null);
            if (user != null) {
                Notification notification = new Notification();
                notification.setUserId(user.getId());
                notification.setTitle("Policy Updated");
                notification.setMessage("Your policy " + "POL-" + savedPolicy.getId() + " has been updated.");
                notification.setType("POLICY");
                notification.setRead(false);
                notification.setCreatedDate(LocalDateTime.now());
                notificationService.saveNotification(notification);
            }
        } catch (Exception e) {
            System.err.println("Failed to create notification: " + e.getMessage());
        }

        return savedPolicy;
    }

    public List<Policy> getPoliciesForReview() {
        List<Policy> allPolicies = repository.findAll();
        List<Policy> policiesForReview = new ArrayList<>();
        
        for (Policy policy : allPolicies) {
            String status = policy.getStatus();
            // Include PENDING policies and also policies that need review (any status)
            if (status == null || status.equalsIgnoreCase("PENDING") || 
                status.equalsIgnoreCase("ACTIVE") || status.equalsIgnoreCase("INACTIVE")) {
                if (policy.getRiskLevel() == null || policy.getRiskLevel().isEmpty()) {
                    double premium = policy.getPremiumAmount();
                    if (premium > 10000) {
                        policy.setRiskLevel("HIGH");
                    } else if (premium > 5000) {
                        policy.setRiskLevel("MEDIUM");
                    } else {
                        policy.setRiskLevel("LOW");
                    }
                }
                policiesForReview.add(policy);
            }
        }
        
        return policiesForReview;
    }

    public Policy approvePolicy(Long policyId) {
        Policy policy = repository.findById(policyId)
            .orElseThrow(() -> new RuntimeException("Policy not found: " + policyId));
        
        policy.setStatus("APPROVED");
        policy.setUpdatedDate(LocalDateTime.now());
        
        Policy savedPolicy = repository.save(policy);
        
        // Send WebSocket notification for real-time update
        try {
            String id = "POL-" + savedPolicy.getId();
            String message = String.format(
                "{\"type\":\"policyStatusChanged\",\"policyId\":\"%s\",\"status\":\"APPROVED\",\"userId\":%d}",
                id, savedPolicy.getUserId()
            );
            dashboardWebSocketHandler.broadcastMessage(message);
        } catch (Exception e) {
            System.err.println("Failed to send WebSocket notification: " + e.getMessage());
        }
        
        // Create notification
        try {
            User user = userRepository.findById(savedPolicy.getUserId()).orElse(null);
            if (user != null) {
                Notification notification = new Notification();
                notification.setUserId(user.getId());
                notification.setTitle("Policy Approved");
                notification.setMessage("Your policy POL-" + savedPolicy.getId() + " has been approved.");
                notification.setType("POLICY");
                notification.setRead(false);
                notification.setCreatedDate(LocalDateTime.now());
                notificationService.saveNotification(notification);
            }
        } catch (Exception e) {
            System.err.println("Failed to create notification: " + e.getMessage());
        }
        
        return savedPolicy;
    }

    public Policy rejectPolicy(Long policyId) {
        Policy policy = repository.findById(policyId)
            .orElseThrow(() -> new RuntimeException("Policy not found: " + policyId));
        
        policy.setStatus("REJECTED");
        policy.setUpdatedDate(LocalDateTime.now());
        
        Policy savedPolicy = repository.save(policy);
        
        // Send WebSocket notification for real-time update
        try {
            String id = "POL-" + savedPolicy.getId();
            String message = String.format(
                "{\"type\":\"policyStatusChanged\",\"policyId\":\"%s\",\"status\":\"REJECTED\",\"userId\":%d}",
                id, savedPolicy.getUserId()
            );
            dashboardWebSocketHandler.broadcastMessage(message);
        } catch (Exception e) {
            System.err.println("Failed to send WebSocket notification: " + e.getMessage());
        }
        
        // Create notification
        try {
            User user = userRepository.findById(savedPolicy.getUserId()).orElse(null);
            if (user != null) {
                Notification notification = new Notification();
                notification.setUserId(user.getId());
                notification.setTitle("Policy Rejected");
                notification.setMessage("Your policy POL-" + savedPolicy.getId() + " has been rejected.");
                notification.setType("POLICY");
                notification.setRead(false);
                notification.setCreatedDate(LocalDateTime.now());
                notificationService.saveNotification(notification);
            }
        } catch (Exception e) {
            System.err.println("Failed to create notification: " + e.getMessage());
        }
        
        return savedPolicy;
    }
}
