package com.insurai.backend.controller;

import com.insurai.backend.model.AuditLog;
import com.insurai.backend.service.AuditLogService;
import jakarta.servlet.http.HttpServletRequest;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.data.domain.Page;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.time.LocalDateTime;
import java.util.HashMap;
import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/admin/audit/logs")
@CrossOrigin(origins = "*")
public class AuditLogController {

    @Autowired
    private AuditLogService auditLogService;

    @GetMapping
    public ResponseEntity<Map<String, Object>> getAuditLogs(
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "10") int size,
            @RequestParam(required = false) String userName,
            @RequestParam(required = false) String module,
            @RequestParam(required = false) String action,
            @RequestParam(required = false) String status,
            @RequestParam(required = false) LocalDateTime dateFrom,
            @RequestParam(required = false) LocalDateTime dateTo) {
        
        Page<AuditLog> logs;
        
        if (userName != null || module != null || action != null || 
            status != null || dateFrom != null || dateTo != null) {
            logs = auditLogService.getFilteredLogs(
                userName, module, action, status, dateFrom, dateTo, page, size);
        } else {
            logs = auditLogService.getAllLogs(page, size, "timestamp", "desc");
        }
        
        Map<String, Object> response = new HashMap<>();
        response.put("content", logs.getContent());
        response.put("totalElements", logs.getTotalElements());
        response.put("totalPages", logs.getTotalPages());
        response.put("currentPage", logs.getNumber());
        response.put("size", logs.getSize());
        
        return ResponseEntity.ok(response);
    }

    @GetMapping("/recent")
    public ResponseEntity<List<AuditLog>> getRecentLogs(
            @RequestParam(defaultValue = "10") int limit) {
        return ResponseEntity.ok(auditLogService.getRecentLogs(limit));
    }

    @GetMapping("/stats")
    public ResponseEntity<Map<String, Object>> getAuditStats() {
        Map<String, Object> stats = new HashMap<>();
        stats.put("totalLogs", auditLogService.getTotalCount());
        stats.put("successfulLogs", auditLogService.getCountByStatus("SUCCESS"));
        stats.put("failedLogs", auditLogService.getCountByStatus("FAILED"));
        return ResponseEntity.ok(stats);
    }

    @PostMapping
    public ResponseEntity<AuditLog> createAuditLog(@RequestBody Map<String, String> request,
                                                   HttpServletRequest servletRequest) {
        String headerIp = servletRequest.getHeader("X-Forwarded-For");
        String remoteIp = (headerIp != null && !headerIp.isBlank()) ? headerIp.split(",")[0].trim() : servletRequest.getRemoteAddr();
        String ipAddress = request.getOrDefault("ipAddress", "").isBlank() ? remoteIp : request.get("ipAddress");

        AuditLog log = auditLogService.createLog(
            Long.parseLong(request.getOrDefault("userId", "0")),
            request.get("userName"),
            request.get("userRole"),
            request.get("action"),
            request.get("module"),
            request.getOrDefault("status", "SUCCESS"),
            request.get("description"),
            ipAddress
        );
        return ResponseEntity.ok(log);
    }
}