package com.insurai.backend.repository;

import com.insurai.backend.model.AuditLog;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.time.LocalDateTime;
import java.util.List;

@Repository
public interface AuditLogRepository extends JpaRepository<AuditLog, Long> {
    
    Page<AuditLog> findAllByOrderByTimestampDesc(Pageable pageable);
    
    Page<AuditLog> findByUserNameContainingOrderByTimestampDesc(String userName, Pageable pageable);
    
    Page<AuditLog> findByModuleOrderByTimestampDesc(String module, Pageable pageable);
    
    Page<AuditLog> findByActionOrderByTimestampDesc(String action, Pageable pageable);
    
    Page<AuditLog> findByStatusOrderByTimestampDesc(String status, Pageable pageable);
    
    @Query("SELECT a FROM AuditLog a WHERE " +
           "(:userName IS NULL OR a.userName LIKE %:userName%) AND " +
           "(:module IS NULL OR a.module = :module) AND " +
           "(:action IS NULL OR a.action = :action) AND " +
           "(:status IS NULL OR a.status = :status) AND " +
           "(:dateFrom IS NULL OR a.timestamp >= :dateFrom) AND " +
           "(:dateTo IS NULL OR a.timestamp <= :dateTo) " +
           "ORDER BY a.timestamp DESC")
    Page<AuditLog> findFiltered(
        @Param("userName") String userName,
        @Param("module") String module,
        @Param("action") String action,
        @Param("status") String status,
        @Param("dateFrom") LocalDateTime dateFrom,
        @Param("dateTo") LocalDateTime dateTo,
        Pageable pageable
    );
    
    List<AuditLog> findTop10ByOrderByTimestampDesc();
    
    long countByStatus(String status);
}