package com.becon.opencelium.backend.license;

public class SubsDTO {
    private String subsId;
    private String type;
    private Long startDate;
    private Long endDate;
    private String duration;
    private Long totalOperationUsage;
    private Long currentOperationUsage;
    private boolean isActive;

    public String getSubsId() {
        return subsId;
    }

    public void setSubsId(String subsId) {
        this.subsId = subsId;
    }

    public String getType() {
        return type;
    }

    public void setType(String type) {
        this.type = type;
    }

    public Long getStartDate() {
        return startDate;
    }

    public void setStartDate(Long startDate) {
        this.startDate = startDate;
    }

    public Long getEndDate() {
        return endDate;
    }

    public void setEndDate(Long endDate) {
        this.endDate = endDate;
    }

    public String getDuration() {
        return duration;
    }

    public void setDuration(String duration) {
        this.duration = duration;
    }

    public Long getTotalOperationUsage() {
        return totalOperationUsage;
    }

    public void setTotalOperationUsage(Long totalOperationUsage) {
        this.totalOperationUsage = totalOperationUsage;
    }

    public Long getCurrentOperationUsage() {
        return currentOperationUsage;
    }

    public void setCurrentOperationUsage(Long currentOperationUsage) {
        this.currentOperationUsage = currentOperationUsage;
    }

    public boolean isActive() {
        return isActive;
    }

    public void setActive(boolean active) {
        isActive = active;
    }
}
