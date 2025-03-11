package com.becon.opencelium.backend.subscription.dto;

import com.becon.opencelium.backend.subscription.enums.ExtraOpsStatus;
import com.fasterxml.jackson.annotation.JsonIgnore;

import java.time.LocalDateTime;

public class ExtraOpsDTO {
    private long id;
    @JsonIgnore
    private String licenseId; // could be subscription id
    private long totalOpsUsage;
    private long currentOpsUsage;
    private long generatedAt; // time when extra ops was generated in ServicePortal
    private long activationDate; // Unix milliseconds
    private long endDate; // Unix milliseconds
    private ExtraOpsStatus status; // Unix milliseconds

    public long getId() {
        return id;
    }

    public void setId(long id) {
        this.id = id;
    }

    public String getLicenseId() {
        return licenseId;
    }

    public void setLicenseId(String licenseId) {
        this.licenseId = licenseId;
    }

    public long getTotalOpsUsage() {
        return totalOpsUsage;
    }

    public void setTotalOpsUsage(long totalOpsUsage) {
        this.totalOpsUsage = totalOpsUsage;
    }

    public long getCurrentOpsUsage() {
        return currentOpsUsage;
    }

    public void setCurrentOpsUsage(long currentOpsUsage) {
        this.currentOpsUsage = currentOpsUsage;
    }

    public long getGeneratedAt() {
        return generatedAt;
    }

    public void setGeneratedAt(long generatedAt) {
        this.generatedAt = generatedAt;
    }

    public long getActivationDate() {
        return activationDate;
    }

    public void setActivationDate(long activationDate) {
        this.activationDate = activationDate;
    }

    public long getEndDate() {
        return endDate;
    }

    public void setEndDate(long endDate) {
        this.endDate = endDate;
    }

    public ExtraOpsStatus getStatus() {
        return status;
    }

    public void setStatus(ExtraOpsStatus status) {
        this.status = status;
    }
}
