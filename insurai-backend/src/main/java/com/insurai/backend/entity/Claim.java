package com.insurai.backend.entity;

import java.math.BigDecimal;
import java.time.LocalDateTime;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.Lob;
import jakarta.persistence.PrePersist;
import jakarta.persistence.PreUpdate;
import jakarta.persistence.Table;
import jakarta.persistence.Transient;

@Entity
@Table(name = "claims")
public class Claim {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false)
    private Long userId;

    private Long policyId;

    @Column(nullable = false)
    private String type; // Vehicle, Health, Property, Travel, General

    @Column(nullable = false)
    private BigDecimal amount;

    private String description;

    @Column(nullable = false)
    private String status; // PENDING, APPROVED, REJECTED, CLOSED

    private String riskLevel; // LOW, MEDIUM, HIGH

    // Payment plan details (optional)
    private Integer paymentTermMonths;
    private java.math.BigDecimal monthlyPayment;

    @Column(nullable = false, updatable = false)
    private LocalDateTime createdDate;

    private LocalDateTime updatedDate;

    private boolean fraudDetected;

    @Lob
    @Column(columnDefinition = "TEXT")
    private String documents; // JSON string containing document metadata

    private String underwriterNotes;

    @Transient
    private String policyNumber;

    @PrePersist
    protected void onCreate() {
        createdDate = LocalDateTime.now();
        updatedDate = LocalDateTime.now();
    }

    @PreUpdate
    protected void onUpdate() {
        updatedDate = LocalDateTime.now();
    }

    // Getters
    public Long getId() { return id; }
    public Long getUserId() { return userId; }
    public Long getPolicyId() { return policyId; }
    public String getType() { return type; }
    public BigDecimal getAmount() { return amount; }
    public String getDescription() { return description; }
    public String getStatus() { return status; }
    public String getRiskLevel() { return riskLevel; }
    public Integer getPaymentTermMonths() { return paymentTermMonths; }
    public java.math.BigDecimal getMonthlyPayment() { return monthlyPayment; }
    public LocalDateTime getCreatedDate() { return createdDate; }
    public LocalDateTime getUpdatedDate() { return updatedDate; }
    public boolean isFraudDetected() { return fraudDetected; }
    public String getDocuments() { return documents; }
    public String getUnderwriterNotes() { return underwriterNotes; }

    // Setters
    public void setId(Long id) { this.id = id; }
    public void setUserId(Long userId) { this.userId = userId; }
    public void setPolicyId(Long policyId) { this.policyId = policyId; }
    public void setType(String type) { this.type = type; }
    public void setAmount(BigDecimal amount) { this.amount = amount; }
    public void setDescription(String description) { this.description = description; }
    public void setStatus(String status) { this.status = status; }
    public void setRiskLevel(String riskLevel) { this.riskLevel = riskLevel; }
    public void setPaymentTermMonths(Integer paymentTermMonths) { this.paymentTermMonths = paymentTermMonths; }
    public void setMonthlyPayment(java.math.BigDecimal monthlyPayment) { this.monthlyPayment = monthlyPayment; }
    public void setCreatedDate(LocalDateTime createdDate) { this.createdDate = createdDate; }
    public void setUpdatedDate(LocalDateTime updatedDate) { this.updatedDate = updatedDate; }
    public void setFraudDetected(boolean fraudDetected) { this.fraudDetected = fraudDetected; }
    public void setDocuments(String documents) { this.documents = documents; }
    public void setUnderwriterNotes(String underwriterNotes) { this.underwriterNotes = underwriterNotes; }

    public String getPolicyNumber() { return policyNumber; }
    public void setPolicyNumber(String policyNumber) { this.policyNumber = policyNumber; }
}

