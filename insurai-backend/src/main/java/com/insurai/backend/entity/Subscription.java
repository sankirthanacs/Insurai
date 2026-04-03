package com.insurai.backend.entity;

import java.math.BigDecimal;
import java.time.LocalDateTime;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.Table;

@Entity
@Table(name = "subscriptions")
public class Subscription {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false)
    private Long userId;

    @Column(nullable = false)
    private String plan;

    @Column(nullable = false)
    private String status; // ACTIVE, CANCELLED

    @Column(nullable = false)
    private LocalDateTime startDate;

    @Column(nullable = false)
    private LocalDateTime renewalDate;

    @Column(nullable = false)
    private BigDecimal cost;

    @Column(nullable = true)
    private LocalDateTime updatedDate;

    public Subscription() {}

    // Getters
    public Long getId() { return id; }
    public Long getUserId() { return userId; }
    public String getPlan() { return plan; }
    public String getStatus() { return status; }
    public LocalDateTime getStartDate() { return startDate; }
    public LocalDateTime getRenewalDate() { return renewalDate; }
    public BigDecimal getCost() { return cost; }
    public LocalDateTime getUpdatedDate() { return updatedDate; }

    // Setters
    public void setId(Long id) { this.id = id; }
    public void setUserId(Long userId) { this.userId = userId; }
    public void setPlan(String plan) { this.plan = plan; }
    public void setStatus(String status) { this.status = status; }
    public void setStartDate(LocalDateTime startDate) { this.startDate = startDate; }
    public void setRenewalDate(LocalDateTime renewalDate) { this.renewalDate = renewalDate; }
    public void setCost(BigDecimal cost) { this.cost = cost; }
    public void setUpdatedDate(LocalDateTime updatedDate) { this.updatedDate = updatedDate; }
}
