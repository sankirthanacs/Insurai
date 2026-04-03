package com.insurai.backend.repository;

import org.springframework.data.jpa.repository.JpaRepository;

import com.insurai.backend.entity.Verification;

public interface VerificationRepository extends JpaRepository<Verification, Long> {
}