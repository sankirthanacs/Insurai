package com.insurai.backend.repository;

import org.springframework.data.jpa.repository.JpaRepository;

import com.insurai.backend.entity.Benefit;

public interface BenefitRepository extends JpaRepository<Benefit, Long> {
}