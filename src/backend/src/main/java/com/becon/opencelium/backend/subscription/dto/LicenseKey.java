package com.becon.opencelium.backend.subscription.dto;

import com.becon.opencelium.backend.utility.crypto.HmacValidator;

public class LicenseKey {
    private long startDate;
    private long endDate;
    private long operationUsage;
    private String subId;
    private String duration;
    private String type;
    private String hmac;

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

    public long getOperationUsage() {
        return operationUsage;
    }

    public void setOperationUsage(long operationUsage) {
        this.operationUsage = operationUsage;
    }

    public String getSubId() {
        return subId;
    }

    public void setSubId(String subId) {
        this.subId = subId;
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

    public String getHmac() {
        return hmac;
    }

    public void setHmac(String hmac) {
        this.hmac = hmac;
    }
}
