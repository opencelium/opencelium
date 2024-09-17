package com.becon.opencelium.backend.resource.subs;

public class SubsDTO {
    private String subId;
    private String licenseId;
    private String type;
    private long startDate;
    private long endDate;
    private String duration;
    private long totalOperationUsage;
    private long currentOperationUsage;
    private boolean active;

    // Getters and Setters
    public String getSubId() {
        return subId;
    }

    public void setSubId(String subId) {
        this.subId = subId;
    }

    public String getLicenseId() {
        return licenseId;
    }

    public void setLicenseId(String licenseId) {
        this.licenseId = licenseId;
    }

    public String getType() {
        return type;
    }

    public void setType(String type) {
        this.type = type;
    }

    public long getStartDate() {
        return startDate;
    }

    public void setStartDate(long startDate) {
        this.startDate = startDate;
    }

    public long getEndDate() {
        return endDate;
    }

    public void setEndDate(long endDate) {
        this.endDate = endDate;
    }

    public String getDuration() {
        return duration;
    }

    public void setDuration(String duration) {
        this.duration = duration;
    }

    public long getTotalOperationUsage() {
        return totalOperationUsage;
    }

    public void setTotalOperationUsage(long totalOperationUsage) {
        this.totalOperationUsage = totalOperationUsage;
    }

    public long getCurrentOperationUsage() {
        return currentOperationUsage;
    }

    public void setCurrentOperationUsage(long currentOperationUsage) {
        this.currentOperationUsage = currentOperationUsage;
    }

    public boolean isActive() {
        return active;
    }

    public void setActive(boolean active) {
        this.active = active;
    }

    @Override
    public String toString() {
        return "SubsDTO{" +
                "subId='" + subId + '\'' +
                ", type='" + type + '\'' +
                ", startDate=" + startDate +
                ", endDate=" + endDate +
                ", duration='" + duration + '\'' +
                ", totalOperationUsage=" + totalOperationUsage +
                ", currentOperationUsage=" + currentOperationUsage +
                ", active=" + active +
                '}';
    }
}
