package com.insurai.backend.repository;

import java.util.List;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import com.insurai.backend.entity.Policy;

@Repository
public interface PolicyRepository extends JpaRepository<Policy, Long> {

    // Pagination support
    Page<Policy> findByUserId(Long userId, Pageable pageable);

    // Non-paginated version for statistics
    List<Policy> findByUserId(Long userId);

    // Find policies by status
    Page<Policy> findByStatus(String status, Pageable pageable);

    // Count queries
    long countByStatus(String status);

    long countByUserId(Long userId);

    // Recent policies
    List<Policy> findTop5ByOrderByCreatedDateDesc();

    // Active policies for a user
    List<Policy> findByUserIdAndStatus(Long userId, String status);
}
