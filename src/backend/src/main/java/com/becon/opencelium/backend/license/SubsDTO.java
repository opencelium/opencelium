package com.becon.opencelium.backend.license;

import java.time.LocalDateTime;

public class SubsDTO {
    private String subsId;
    private String type;
    private LocalDateTime startDate;
    private LocalDateTime endDate;
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

    public LocalDateTime getStartDate() {
        return startDate;
    }

    public void setStartDate(LocalDateTime startDate) {
        this.startDate = startDate;
    }

    public LocalDateTime getEndDate() {
        return endDate;
    }

    public void setEndDate(LocalDateTime endDate) {
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
