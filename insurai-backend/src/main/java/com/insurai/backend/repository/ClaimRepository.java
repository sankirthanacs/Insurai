package com.insurai.backend.repository;

import java.util.List;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import com.insurai.backend.entity.Claim;

@Repository
public interface ClaimRepository extends JpaRepository<Claim, Long> {

    // ✅ Pagination (CRITICAL FIX)
    Page<Claim> findByUserId(Long userId, Pageable pageable);

    // ✅ Non-paginated version for statistics
    List<Claim> findByUserId(Long userId);

    Page<Claim> findByRiskLevel(String riskLevel, Pageable pageable);

    Page<Claim> findByFraudDetected(boolean fraudDetected, Pageable pageable);

    // ✅ Keep small limited queries (SAFE)
    // Only 5 records → OK
    java.util.List<Claim> findTop5ByOrderByCreatedDateDesc();

    // ✅ Recent activity - top 10 by updated date
    java.util.List<Claim> findTop10ByOrderByUpdatedDateDesc();

    // ✅ Count queries are fine
    long countByFraudDetected(boolean fraudDetected);

    long countByStatus(String status);

    long countByRiskLevel(String riskLevel);
}