package com.becon.opencelium.backend.subscription.remoteapi.dto;

import com.becon.opencelium.backend.database.mysql.entity.OperationUsageHistory;

import java.time.ZoneOffset;

public class UsageHistoryDto {

    private Long id;
    private String licenseId;
    private String subId;
    private String connectionTitle;
    private Long totalUsage;
    private long createdAt;
    private long modifiedAt;
    private String fromConnector;
    private String toConnector;

    public UsageHistoryDto() {
    }

    public UsageHistoryDto(OperationUsageHistory operationUsageHistory) {
        this.id = operationUsageHistory.getId();
        this.licenseId = operationUsageHistory.getLicenseId();
        this.subId = operationUsageHistory.getSubId();
        this.connectionTitle = operationUsageHistory.getConnectionTitle();
        this.totalUsage = operationUsageHistory.getTotalUsage();
        this.createdAt = operationUsageHistory.getCreatedAt().toInstant(ZoneOffset.UTC).toEpochMilli();
        this.modifiedAt = operationUsageHistory.getModifiedAt().toInstant(ZoneOffset.UTC).toEpochMilli();
        this.fromConnector = operationUsageHistory.getFromInvoker();
        this.toConnector = operationUsageHistory.getToInvoker();
    }

    public Long getId() {
        return id;
    }

    public void setId(Long id) {
        this.id = id;
    }

    public String getLicenseId() {
        return licenseId;
    }

    public void setLicenseId(String licenseId) {
        this.licenseId = licenseId;
    }

    public String getSubId() {
        return subId;
    }

    public void setSubId(String subId) {
        this.subId = subId;
    }

    public String getConnectionTitle() {
        return connectionTitle;
    }

    public void setConnectionTitle(String connectionTitle) {
        this.connectionTitle = connectionTitle;
    }

    public Long getTotalUsage() {
        return totalUsage;
    }

    public void setTotalUsage(Long totalUsage) {
        this.totalUsage = totalUsage;
    }

    public long getCreatedAt() {
        return createdAt;
    }

    public void setCreatedAt(long createdAt) {
        this.createdAt = createdAt;
    }

    public long getModifiedAt() {
        return modifiedAt;
    }

    public void setModifiedAt(long modifiedAt) {
        this.modifiedAt = modifiedAt;
    }

    public String getFromConnector() {
        return fromConnector;
    }

    public void setFromConnector(String fromConnector) {
        this.fromConnector = fromConnector;
    }

    public String getToConnector() {
        return toConnector;
    }

    public void setToConnector(String toConnector) {
        this.toConnector = toConnector;
    }
}
