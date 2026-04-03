package com.insurai.backend.dto;

public class SystemMetricsDTO {
    private double cpuUsage;
    private double memoryUsage;
    private double diskUsage;
    private double networkUsage;
    private long activeSessions;
    private long apiRequests;
    private long failedRequests;
    private long avgResponseTime;
    private String uptime;

    // Constructors
    public SystemMetricsDTO() {}

    public SystemMetricsDTO(double cpuUsage, double memoryUsage, double diskUsage,
                          double networkUsage, long activeSessions, long apiRequests,
                          long failedRequests, long avgResponseTime, String uptime) {
        this.cpuUsage = cpuUsage;
        this.memoryUsage = memoryUsage;
        this.diskUsage = diskUsage;
        this.networkUsage = networkUsage;
        this.activeSessions = activeSessions;
        this.apiRequests = apiRequests;
        this.failedRequests = failedRequests;
        this.avgResponseTime = avgResponseTime;
        this.uptime = uptime;
    }

    // Getters and Setters
    public double getCpuUsage() {
        return cpuUsage;
    }

    public void setCpuUsage(double cpuUsage) {
        this.cpuUsage = cpuUsage;
    }

    public double getMemoryUsage() {
        return memoryUsage;
    }

    public void setMemoryUsage(double memoryUsage) {
        this.memoryUsage = memoryUsage;
    }

    public double getDiskUsage() {
        return diskUsage;
    }

    public void setDiskUsage(double diskUsage) {
        this.diskUsage = diskUsage;
    }

    public double getNetworkUsage() {
        return networkUsage;
    }

    public void setNetworkUsage(double networkUsage) {
        this.networkUsage = networkUsage;
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

    public long getFailedRequests() {
        return failedRequests;
    }

    public void setFailedRequests(long failedRequests) {
        this.failedRequests = failedRequests;
    }

    public long getAvgResponseTime() {
        return avgResponseTime;
    }

    public void setAvgResponseTime(long avgResponseTime) {
        this.avgResponseTime = avgResponseTime;
    }

    public String getUptime() {
        return uptime;
    }

    public void setUptime(String uptime) {
        this.uptime = uptime;
    }
}