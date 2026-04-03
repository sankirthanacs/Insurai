package com.insurai.backend.dto;

import java.time.LocalDateTime;

public class PolicyDTO {
    private Long id;
    private Long userId;
    private String policyNumber;
    private String policyHolder;
    private double premiumAmount;
    private String status;
    private LocalDateTime startDate;
    private LocalDateTime endDate;
    private LocalDateTime createdDate;
    private LocalDateTime updatedDate;

    public PolicyDTO() {}

    public PolicyDTO(Long id, Long userId, String policyNumber, String policyHolder, double premiumAmount,
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
}
