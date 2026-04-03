package com.insurai.backend.entity;

import java.time.LocalDateTime;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.Table;

@Entity
@Table(name = "policies")
public class Policy {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false)
    private Long userId;

    @Column(nullable = false)
    private String policyNumber;

    @Column(nullable = false)
    private String policyHolder;

    private double premiumAmount;

    @Column(nullable = false)
    private String status; // ACTIVE, INACTIVE, EXPIRED, CANCELLED

    @Column(nullable = true)
    private LocalDateTime startDate;

    @Column(nullable = true)
    private LocalDateTime endDate;

    @Column(nullable = true)
    private LocalDateTime createdDate;

    @Column(nullable = true)
    private LocalDateTime updatedDate;

    @Column(nullable = true)
    private String riskLevel; // LOW, MEDIUM, HIGH

    public Policy() {}

    public Policy(Long id, Long userId, String policyNumber, String policyHolder, double premiumAmount, 
                  String status, LocalDateTime startDate, LocalDateTime endDate, LocalDateTime createdDate, 
                  LocalDateTime updatedDate) {
        this.id = id;
        this.userId = userId;
        this.policyNumber = policyNumber;
        this.policyHolder = policyHolder;
        this.premiumAmount = premiumAmount;
        this.status = status;
        this.startDate = startDate;
        this.endDate = endDate;
        this.createdDate = createdDate;
        this.updatedDate = updatedDate;
    }

    // Getters
    public Long getId() { return id; }
    public Long getUserId() { return userId; }
    public String getPolicyNumber() { return policyNumber; }
    public String getPolicyHolder() { return policyHolder; }
    public double getPremiumAmount() { return premiumAmount; }
    public String getStatus() { return status; }
    public LocalDateTime getStartDate() { return startDate; }
    public LocalDateTime getEndDate() { return endDate; }
    public LocalDateTime getCreatedDate() { return createdDate; }
    public LocalDateTime getUpdatedDate() { return updatedDate; }
    public String getRiskLevel() { return riskLevel; }

    // Setters
    public void setId(Long id) { this.id = id; }
    public void setUserId(Long userId) { this.userId = userId; }
    public void setPolicyNumber(String policyNumber) { this.policyNumber = policyNumber; }
    public void setPolicyHolder(String policyHolder) { this.policyHolder = policyHolder; }
    public void setPremiumAmount(double premiumAmount) { this.premiumAmount = premiumAmount; }
    public void setStatus(String status) { this.status = status; }
    public void setStartDate(LocalDateTime startDate) { this.startDate = startDate; }
    public void setEndDate(LocalDateTime endDate) { this.endDate = endDate; }
    public void setCreatedDate(LocalDateTime createdDate) { this.createdDate = createdDate; }
    public void setUpdatedDate(LocalDateTime updatedDate) { this.updatedDate = updatedDate; }
    public void setRiskLevel(String riskLevel) { this.riskLevel = riskLevel; }
}