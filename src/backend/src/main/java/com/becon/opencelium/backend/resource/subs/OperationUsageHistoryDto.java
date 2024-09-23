package com.becon.opencelium.backend.resource.subs;

import com.becon.opencelium.backend.database.mysql.entity.OperationUsageHistory;

public class OperationUsageHistoryDto {
    private Long id;
    private String licenseId;
    private String subId;
    private String connectionTitle;
    private Long totalUsage;

    public OperationUsageHistoryDto(OperationUsageHistory operationUsageHistory) {
        this.id = operationUsageHistory.getId();
        this.licenseId = operationUsageHistory.getLicenseId();
        this.subId = operationUsageHistory.getSubId();
        this.connectionTitle = operationUsageHistory.getConnectionTitle();
        this.totalUsage = operationUsageHistory.getTotalUsage();
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
}
