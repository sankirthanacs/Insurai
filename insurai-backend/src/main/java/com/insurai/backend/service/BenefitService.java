package com.insurai.backend.service;

import java.util.List;

import org.springframework.stereotype.Service;

import com.insurai.backend.entity.Benefit;
import com.insurai.backend.repository.BenefitRepository;

@Service
public class BenefitService {

    private final BenefitRepository benefitRepository;

    public BenefitService(BenefitRepository benefitRepository) {
        this.benefitRepository = benefitRepository;
    }

    public List<Benefit> getAllBenefits() {
        return benefitRepository.findAll();
    }

    public Benefit saveBenefit(Benefit benefit) {
        return benefitRepository.save(benefit);
    }

    public Benefit assignBenefit(Long benefitId, String userEmail) {
        Benefit benefit = benefitRepository.findById(benefitId)
            .orElseThrow(() -> new RuntimeException("Benefit not found"));
        
        if (benefit.getEnrolled() < benefit.getTotal()) {
            benefit.setEnrolled(benefit.getEnrolled() + 1);
            return benefitRepository.save(benefit);
        }
        throw new RuntimeException("Benefit is fully enrolled");
    }
}