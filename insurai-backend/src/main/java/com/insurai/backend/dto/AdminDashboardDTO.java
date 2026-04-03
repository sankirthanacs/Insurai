package com.insurai.backend.dto;

import java.util.List;
import java.util.Map;

public class AdminDashboardDTO {
    private long totalUsers;
    private long pendingClaims;
    private long fraudAlerts;
    private long highRiskClaims;
    private long activePolicies;
    private long activeSessions;
    private long apiRequests;
    private SystemMetricsDTO systemMetrics;
    private List<Map<String, Object>> recentClaims;
    private List<Map<String, Object>> activityFeed;
    private List<Map<String, Object>> fraudAlertsList;
    private Map<String, Object> claimStats;
    private Map<String, Object> userStats;
    private Map<String, Object> monthlyTrends;

    // Constructors
    public AdminDashboardDTO() {}

    public AdminDashboardDTO(long totalUsers, long pendingClaims, long fraudAlerts, 
                           long highRiskClaims, long activePolicies, long activeSessions,
                           long apiRequests, SystemMetricsDTO systemMetrics,
                           List<Map<String, Object>> recentClaims,
                           List<Map<String, Object>> activityFeed,
                           List<Map<String, Object>> fraudAlertsList,
                           Map<String, Object> claimStats,
                           Map<String, Object> userStats,
                           Map<String, Object> monthlyTrends) {
        this.totalUsers = totalUsers;
        this.pendingClaims = pendingClaims;
        this.fraudAlerts = fraudAlerts;
        this.highRiskClaims = highRiskClaims;
        this.activePolicies = activePolicies;
        this.activeSessions = activeSessions;
        this.apiRequests = apiRequests;
        this.systemMetrics = systemMetrics;
        this.recentClaims = recentClaims;
        this.activityFeed = activityFeed;
        this.fraudAlertsList = fraudAlertsList;
        this.claimStats = claimStats;
        this.userStats = userStats;
        this.monthlyTrends = monthlyTrends;
    }

    // Getters and Setters
    public long getTotalUsers() {
        return totalUsers;
    }

    public void setTotalUsers(long totalUsers) {
        this.totalUsers = totalUsers;
    }

    public long getPendingClaims() {
        return pendingClaims;
    }

    public void setPendingClaims(long pendingClaims) {
        this.pendingClaims = pendingClaims;
    }

    public long getFraudAlerts() {
        return fraudAlerts;
    }

    public void setFraudAlerts(long fraudAlerts) {
        this.fraudAlerts = fraudAlerts;
    }

    public long getHighRiskClaims() {
        return highRiskClaims;
    }

    public void setHighRiskClaims(long highRiskClaims) {
        this.highRiskClaims = highRiskClaims;
    }

    public long getActivePolicies() {
        return activePolicies;
    }

    public void setActivePolicies(long activePolicies) {
        this.activePolicies = activePolicies;
    }

    public long getActiveSessions() {
        return activeSessions;
    }

    public void setActiveSessions(long activeSessions) {
        this.activeSessions = activeSessions;
    }

    public long getApiRequests() {
        return apiRequests;
    }

    public void setApiRequests(long apiRequests) {
        this.apiRequests = apiRequests;
    }

    public SystemMetricsDTO getSystemMetrics() {
        return systemMetrics;
    }

    public void setSystemMetrics(SystemMetricsDTO systemMetrics) {
        this.systemMetrics = systemMetrics;
    }

    public List<Map<String, Object>> getRecentClaims() {
        return recentClaims;
    }

    public void setRecentClaims(List<Map<String, Object>> recentClaims) {
        this.recentClaims = recentClaims;
    }

    public List<Map<String, Object>> getActivityFeed() {
        return activityFeed;
    }

    public void setActivityFeed(List<Map<String, Object>> activityFeed) {
        this.activityFeed = activityFeed;
    }

    public List<Map<String, Object>> getFraudAlertsList() {
        return fraudAlertsList;
    }

    public void setFraudAlertsList(List<Map<String, Object>> fraudAlertsList) {
        this.fraudAlertsList = fraudAlertsList;
    }

    public Map<String, Object> getClaimStats() {
        return claimStats;
    }

    public void setClaimStats(Map<String, Object> claimStats) {
        this.claimStats = claimStats;
    }

    public Map<String, Object> getUserStats() {
        return userStats;
    }

    public void setUserStats(Map<String, Object> userStats) {
        this.userStats = userStats;
    }

    public Map<String, Object> getMonthlyTrends() {
        return monthlyTrends;
    }

    public void setMonthlyTrends(Map<String, Object> monthlyTrends) {
        this.monthlyTrends = monthlyTrends;
    }
}
