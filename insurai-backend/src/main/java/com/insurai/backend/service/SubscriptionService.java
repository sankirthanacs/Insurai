
package com.insurai.backend.service;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;

import org.springframework.stereotype.Service;

import com.insurai.backend.entity.Policy;
import com.insurai.backend.entity.Subscription;
import com.insurai.backend.entity.User;
import com.insurai.backend.repository.PolicyRepository;
import com.insurai.backend.repository.SubscriptionRepository;
import com.insurai.backend.repository.UserRepository;

@Service
public class SubscriptionService {

    private final SubscriptionRepository subscriptionRepository;
    private final UserRepository userRepository;
    private final PolicyRepository policyRepository;

    public SubscriptionService(SubscriptionRepository subscriptionRepository, UserRepository userRepository, PolicyRepository policyRepository) {
        this.subscriptionRepository = subscriptionRepository;
        this.userRepository = userRepository;
        this.policyRepository = policyRepository;
    }

    public Subscription getOrCreateSubscriptionForUser(String userEmail) {
        User user = userRepository.findByEmail(userEmail)
                .orElseThrow(() -> new RuntimeException("User not found: " + userEmail));

        Optional<Subscription> existing = subscriptionRepository.findByUserId(user.getId());
        if (existing.isPresent()) {
            return existing.get();
        }

        // Create a default subscription for new users
        Subscription subscription = new Subscription();
        subscription.setUserId(user.getId());
        subscription.setPlan("Professional");
        subscription.setStatus("ACTIVE");
        subscription.setStartDate(LocalDateTime.now());
        subscription.setRenewalDate(LocalDateTime.now().plusMonths(1));
        subscription.setCost(BigDecimal.valueOf(29.99));
        subscription.setUpdatedDate(LocalDateTime.now());

        Subscription savedSubscription = subscriptionRepository.save(subscription);

        // Create a default policy for the user when they subscribe
        createDefaultPolicyForUser(user, savedSubscription);

        return savedSubscription;
    }

    /**
     * Creates a default insurance policy for a user when they subscribe.
     * This ensures users have a policy available to file claims.
     */
    private void createDefaultPolicyForUser(User user, Subscription subscription) {
        // Check if user already has policies
        List<Policy> existingPolicies = policyRepository.findByUserId(user.getId());
        if (existingPolicies != null && !existingPolicies.isEmpty()) {
            return; // User already has policies, don't create another
        }

        // Generate a unique policy number
        String policyNumber = "POL-" + subscription.getId() + "-" + System.currentTimeMillis() % 10000;
        
        Policy policy = new Policy();
        policy.setUserId(user.getId());
        policy.setPolicyNumber(policyNumber);
        policy.setPolicyHolder(user.getFirstName() + " " + user.getLastName());
        policy.setPremiumAmount(subscription.getCost().doubleValue() * 12); // Annual premium
        policy.setStatus("PENDING");
        policy.setStartDate(LocalDateTime.now());
        policy.setEndDate(LocalDateTime.now().plusYears(1));
        policy.setCreatedDate(LocalDateTime.now());
        policy.setUpdatedDate(LocalDateTime.now());

        policyRepository.save(policy);
    }

    public Subscription upgradeSubscription(String userEmail, String newPlan, BigDecimal newCost) {
        Subscription subscription = getOrCreateSubscriptionForUser(userEmail);
        subscription.setPlan(newPlan);
        subscription.setCost(newCost);
        subscription.setStatus("ACTIVE");
        subscription.setUpdatedDate(LocalDateTime.now());
        // Reset renewal to 1 month from now
        subscription.setRenewalDate(LocalDateTime.now().plusMonths(1));
        return subscriptionRepository.save(subscription);
    }

    public Subscription cancelSubscription(String userEmail) {
        Subscription subscription = getOrCreateSubscriptionForUser(userEmail);
        subscription.setStatus("CANCELLED");
        subscription.setUpdatedDate(LocalDateTime.now());
        return subscriptionRepository.save(subscription);
    }
}
