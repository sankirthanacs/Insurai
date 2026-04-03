package com.insurai.backend.service;

import com.insurai.backend.model.AuditLog;
import com.insurai.backend.repository.AuditLogRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;
import org.springframework.messaging.simp.SimpMessagingTemplate;
import org.springframework.stereotype.Service;

import java.time.LocalDateTime;
import java.util.List;

@Service
public class AuditLogService {

    @Autowired
    private AuditLogRepository auditLogRepository;

    @Autowired(required = false)
    private SimpMessagingTemplate messagingTemplate;

    public AuditLog createLog(Long userId, String userName, String userRole, 
                              String action, String module, String status, 
                              String description, String ipAddress) {
        AuditLog log = new AuditLog(userId, userName, userRole, action, module, status, description, ipAddress);
        AuditLog savedLog = auditLogRepository.save(log);
        
        // Broadcast to WebSocket clients if available
        if (messagingTemplate != null) {
            messagingTemplate.convertAndSend("/topic/audit-logs", savedLog);
        }
        
        return savedLog;
    }

    public Page<AuditLog> getAllLogs(int page, int size, String sortBy, String direction) {
        Sort sort = direction.equalsIgnoreCase("asc") ? 
            Sort.by(sortBy).ascending() : Sort.by(sortBy).descending();
        Pageable pageable = PageRequest.of(page, size, sort);
        return auditLogRepository.findAllByOrderByTimestampDesc(pageable);
    }

    public Page<AuditLog> getFilteredLogs(String userName, String module, String action, 
                                          String status, LocalDateTime dateFrom, LocalDateTime dateTo,
                                          int page, int size) {
        Pageable pageable = PageRequest.of(page, size, Sort.by("timestamp").descending());
        return auditLogRepository.findFiltered(userName, module, action, status, dateFrom, dateTo, pageable);
    }

    public List<AuditLog> getRecentLogs(int limit) {
        return auditLogRepository.findTop10ByOrderByTimestampDesc();
    }

    public long getTotalCount() {
        return auditLogRepository.count();
    }

    public long getCountByStatus(String status) {
        return auditLogRepository.countByStatus(status);
    }

    // Convenience methods for common audit actions
    public void logLogin(Long userId, String userName, String ipAddress, boolean success) {
        createLog(userId, userName, "USER", "LOGIN", "auth", 
                 success ? "SUCCESS" : "FAILED", 
                 success ? "User logged in successfully" : "Failed login attempt", 
                 ipAddress);
    }

    public void logLogout(Long userId, String userName, String ipAddress) {
        createLog(userId, userName, "USER", "LOGOUT", "auth", "SUCCESS", 
                 "User logged out", ipAddress);
    }

    public void logPolicyCreate(Long userId, String userName, String policyId, String ipAddress) {
        createLog(userId, userName, "USER", "CREATE", "policies", "SUCCESS", 
                 "Created new policy " + policyId, ipAddress);
    }

    public void logPolicyUpdate(Long userId, String userName, String policyId, String ipAddress) {
        createLog(userId, userName, "USER", "UPDATE", "policies", "SUCCESS", 
                 "Updated policy " + policyId, ipAddress);
    }

    public void logPolicyDelete(Long userId, String userName, String policyId, String ipAddress) {
        createLog(userId, userName, "USER", "DELETE", "policies", "SUCCESS", 
                 "Deleted policy " + policyId, ipAddress);
    }

    public void logClaimCreate(Long userId, String userName, String claimId, String ipAddress) {
        createLog(userId, userName, "USER", "CREATE", "claims", "SUCCESS", 
                 "Created new claim " + claimId, ipAddress);
    }

    public void logClaimApprove(Long userId, String userName, String claimId, String ipAddress) {
        createLog(userId, userName, "UNDERWRITER", "APPROVE", "claims", "SUCCESS", 
                 "Approved claim " + claimId, ipAddress);
    }

    public void logClaimReject(Long userId, String userName, String claimId, String reason, String ipAddress) {
        createLog(userId, userName, "UNDERWRITER", "REJECT", "claims", "SUCCESS", 
                 "Rejected claim " + claimId + " - " + reason, ipAddress);
    }

    public void logUserCreate(Long userId, String userName, String targetUserId, String ipAddress) {
        createLog(userId, userName, "ADMIN", "CREATE", "users", "SUCCESS", 
                 "Created new user " + targetUserId, ipAddress);
    }

    public void logUserUpdate(Long userId, String userName, String targetUserId, String ipAddress) {
        createLog(userId, userName, "ADMIN", "UPDATE", "users", "SUCCESS", 
                 "Updated user " + targetUserId, ipAddress);
    }

    public void logUserDelete(Long userId, String userName, String targetUserId, String ipAddress) {
        createLog(userId, userName, "ADMIN", "DELETE", "users", "SUCCESS", 
                 "Deleted user " + targetUserId, ipAddress);
    }
}