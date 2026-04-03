package com.insurai.backend.service;

import org.springframework.stereotype.Service;

@Service
public class ChatService {

    public String processMessage(String message, String userId) {
        if (message == null || message.trim().isEmpty()) {
            return "Please ask me something about InsurAI services.";
        }

        String lowerMessage = message.toLowerCase();

        // Policy-related queries
        if (lowerMessage.contains("policy") || lowerMessage.contains("policies")) {
            if (lowerMessage.contains("how") || lowerMessage.contains("apply")) {
                return "To apply for a policy, go to the 'My Policies' section in your dashboard. You can view available policies and apply for the ones that suit your needs. Each policy has different coverage levels and premium costs.";
            }
            if (lowerMessage.contains("renew") || lowerMessage.contains("renewal")) {
                return "Policy renewals are automatic unless you choose to cancel. You'll receive a reminder email before your renewal date. You can manage your policies in the 'My Policies' section.";
            }
            return "Our policies cover various insurance needs including health, auto, home, and travel. Visit the 'My Policies' section to view your active policies and explore new options.";
        }

        // Claims-related queries
        if (lowerMessage.contains("claim") || lowerMessage.contains("claims")) {
            if (lowerMessage.contains("file") || lowerMessage.contains("submit")) {
                return "To file a claim, go to 'File Claim' in the sidebar. Fill out the claim form with incident details, amount, and description. Your claim will be reviewed and you'll receive updates via email.";
            }
            if (lowerMessage.contains("track") || lowerMessage.contains("status")) {
                return "You can track all your claims in the 'My Claims' section. Here you can see claim status, documents, and communication history.";
            }
            if (lowerMessage.contains("reject") || lowerMessage.contains("denial")) {
                return "If your claim is rejected, you'll receive a detailed reason. You can contact our support team to appeal or discuss the decision. Check the claim details for next steps.";
            }
            return "A claim is a request for coverage under your policy. Once you file a claim (go to 'File Claim'), our team reviews it and provides a decision. You can track progress in 'My Claims'.";
        }

        // Coverage-related queries
        if (lowerMessage.contains("coverage") || lowerMessage.contains("benefit") || lowerMessage.contains("cover")) {
            return "Coverage varies by policy type. Review your policy details in 'My Policies' to see what's covered. You can also contact our support team for specific coverage questions.";
        }

        // Subscription-related queries
        if (lowerMessage.contains("subscription") || lowerMessage.contains("cancel") || lowerMessage.contains("upgrade")) {
            return "Visit the 'Subscription' section to manage your subscription. You can upgrade, downgrade, or cancel anytime. Changes take effect at the end of your current billing period.";
        }

        // Profile and account-related queries
        if (lowerMessage.contains("profile") || lowerMessage.contains("personal") || lowerMessage.contains("account")) {
            return "Go to 'Profile' to update your personal information, notification preferences, and account settings. Two-factor authentication is available for enhanced security.";
        }

        // General help
        if (lowerMessage.contains("help") || lowerMessage.contains("support") || lowerMessage.contains("contact")) {
            return "I'm here to help! You can ask me about policies, claims, coverage, subscriptions, or your profile. For additional support, contact our customer service team.";
        }

        // Default response
        return "I can help you with information about policies, claims, coverage, subscriptions, and your profile. What would you like to know?";
    }
}
