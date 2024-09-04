package com.becon.opencelium.backend.license;

import java.time.Instant;

public class LicenseKey {
    private Instant startDate;
    private Instant endDate;
    private String duration;
    private String type;
    private Long operationUsage;
    private String subId;
    private String hmac;

    public Instant getStartDate() {
        return startDate;
    }

    public void setStartDate(Instant startDate) {
        this.startDate = startDate;
    }

    public Instant getEndDate() {
        return endDate;
    }

    public void setEndDate(Instant endDate) {
        this.endDate = endDate;
    }

    public String getDuration() {
        return duration;
    }

    public void setDuration(String duration) {
        this.duration = duration;
    }

    public String getType() {
        return type;
    }

    public void setType(String type) {
        this.type = type;
    }

    public Long getOperationUsage() {
        return operationUsage;
    }

    public void setOperationUsage(Long operationUsage) {
        this.operationUsage = operationUsage;
    }

    public String getSubId() {
        return subId;
    }

    public void setSubId(String subId) {
        this.subId = subId;
    }

    public String getHmac() {
        return hmac;
    }

    public void setHmac(String hmac) {
        this.hmac = hmac;
    }
}
