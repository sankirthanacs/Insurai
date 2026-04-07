package com.insurai.backend.service;

import com.insurai.backend.entity.Claim;
import com.insurai.backend.entity.User;
import jakarta.mail.MessagingException;
import jakarta.mail.internet.MimeMessage;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.mail.javamail.JavaMailSender;
import org.springframework.mail.javamail.MimeMessageHelper;
import org.springframework.stereotype.Service;

@Service
public class EmailService {

    @Autowired
    private JavaMailSender mailSender;

    @Value("${insurai.app.name:InsurAI}")
    private String appName;

    public void sendClaimSubmissionEmail(User user, Claim claim) {
        String subject = "Claim Submitted - " + appName;
        String body = buildEmailBody(
            user.getUsername(),
            "CLM-" + claim.getId(),
            "Submitted",
            "Your claim has been successfully submitted and is now pending review. " +
            "Our team will process your claim shortly. You can track the status in your dashboard."
        );
        sendEmail(user.getEmail(), subject, body);
    }

    public void sendClaimApprovalEmail(User user, Claim claim) {
        String subject = "Claim Approved - " + appName;
        String body = buildEmailBody(
            user.getUsername(),
            "CLM-" + claim.getId(),
            "Approved",
            "Great news! Your claim has been approved. " +
            "The approved amount will be processed according to your policy terms. " +
            "You will receive further instructions regarding the payout."
        );
        sendEmail(user.getEmail(), subject, body);
    }

    public void sendClaimRejectionEmail(User user, Claim claim) {
        String subject = "Claim Rejected - " + appName;
        String body = buildEmailBody(
            user.getUsername(),
            "CLM-" + claim.getId(),
            "Rejected",
            "We regret to inform you that your claim has been rejected. " +
            "For more information, please contact our support team or check your dashboard for details."
        );
        sendEmail(user.getEmail(), subject, body);
    }

    private String buildEmailBody(String username, String claimId, String status, String message) {
        return "<div style='font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #e0e0e0; border-radius: 8px;'>" +
               "<h2 style='color: #2c3e50; border-bottom: 2px solid #3498db; padding-bottom: 10px;'>" + appName + "</h2>" +
               "<p>Dear <strong>" + username + "</strong>,</p>" +
               "<p style='color: #555; line-height: 1.6;'>" + message + "</p>" +
               "<div style='background-color: #f8f9fa; padding: 15px; border-radius: 5px; margin: 20px 0;'>" +
               "<p style='margin: 5px 0;'><strong>Claim ID:</strong> " + claimId + "</p>" +
               "<p style='margin: 5px 0;'><strong>Status:</strong> <span style='color: " + getStatusColor(status) + "; font-weight: bold;'>" + status + "</span></p>" +
               "</div>" +
               "<p style='color: #777; font-size: 12px; margin-top: 30px;'>If you have any questions, please contact our support team.</p>" +
               "<p style='color: #555;'>Regards,<br/>Team " + appName + "</p>" +
               "</div>";
    }

    private String getStatusColor(String status) {
        switch (status) {
            case "Approved": return "#27ae60";
            case "Rejected": return "#e74c3c";
            case "Submitted": return "#3498db";
            default: return "#555";
        }
    }

    private void sendEmail(String to, String subject, String body) {
        try {
            MimeMessage message = mailSender.createMimeMessage();
            MimeMessageHelper helper = new MimeMessageHelper(message, true, "UTF-8");
            helper.setTo(to);
            helper.setSubject(subject);
            helper.setText(body, true);
            mailSender.send(message);
        } catch (MessagingException e) {
            System.err.println("Failed to send email to " + to + ": " + e.getMessage());
        }
    }
}
