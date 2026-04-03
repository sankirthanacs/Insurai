package com.insurai.backend.dto;

import java.math.BigDecimal;
import java.time.LocalDateTime;

public class ClaimDTO {
    private Long id;
    private Long userId;
    private Long policyId;
    private String claimType;      // Frontend sends "claimType"
    private BigDecimal amount;
    private String incidentDate;   // Frontend sends "incidentDate"
    private String description;
    private String status;
    private String riskLevel;
    private Integer paymentTermMonths;
    private java.math.BigDecimal monthlyPayment;
    private LocalDateTime createdDate;
    private LocalDateTime updatedDate;

    private String documents; // JSON string containing document metadata

    public ClaimDTO() {}

    public ClaimDTO(Long id, Long userId, String claimType, BigDecimal amount, String incidentDate,
                    String description, String status, String riskLevel, Integer paymentTermMonths,
                    java.math.BigDecimal monthlyPayment, LocalDateTime createdDate, LocalDateTime updatedDate) {
        this.id = id;
        this.userId = userId;
        this.claimType = claimType;
        this.amount = amount;
        this.incidentDate = incidentDate;
        this.description = description;
        this.status = status;
        this.riskLevel = riskLevel;
        this.paymentTermMonths = paymentTermMonths;
        this.monthlyPayment = monthlyPayment;
        this.createdDate = createdDate;
        this.updatedDate = updatedDate;
    }

    // Getters
    public Long getId() { return id; }
    public Long getUserId() { return userId; }
    public Long getPolicyId() { return policyId; }
    public String getClaimType() { return claimType; }
    public BigDecimal getAmount() { return amount; }
    public String getIncidentDate() { return incidentDate; }
    public String getDescription() { return description; }
    public String getStatus() { return status; }
    public String getRiskLevel() { return riskLevel; }
    public Integer getPaymentTermMonths() { return paymentTermMonths; }
    public java.math.BigDecimal getMonthlyPayment() { return monthlyPayment; }
    public LocalDateTime getCreatedDate() { return createdDate; }
    public LocalDateTime getUpdatedDate() { return updatedDate; }
    public String getDocuments() { return documents; }

    // Setters
    public void setId(Long id) { this.id = id; }
    public void setUserId(Long userId) { this.userId = userId; }
    public void setPolicyId(Long policyId) { this.policyId = policyId; }
    public void setClaimType(String claimType) { this.claimType = claimType; }
    public void setAmount(BigDecimal amount) { this.amount = amount; }
    public void setIncidentDate(String incidentDate) { this.incidentDate = incidentDate; }
    public void setDescription(String description) { this.description = description; }
    public void setStatus(String status) { this.status = status; }
    public void setRiskLevel(String riskLevel) { this.riskLevel = riskLevel; }
    public void setPaymentTermMonths(Integer paymentTermMonths) { this.paymentTermMonths = paymentTermMonths; }
    public void setMonthlyPayment(java.math.BigDecimal monthlyPayment) { this.monthlyPayment = monthlyPayment; }
    public void setCreatedDate(LocalDateTime createdDate) { this.createdDate = createdDate; }
    public void setUpdatedDate(LocalDateTime updatedDate) { this.updatedDate = updatedDate; }
    public void setDocuments(String documents) { this.documents = documents; }
}
