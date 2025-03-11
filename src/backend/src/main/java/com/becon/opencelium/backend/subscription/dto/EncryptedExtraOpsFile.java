package com.becon.opencelium.backend.subscription.dto;

public class EncryptedExtraOpsFile {
    private String licenseId;
    private long totalOpsUsage;
    private long generatedAt;

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

    public long getGeneratedAt() {
        return generatedAt;
    }

    public void setGeneratedAt(long generatedAt) {
        this.generatedAt = generatedAt;
    }
}
