package com.becon.opencelium.backend.subscription.dto;

import com.becon.opencelium.backend.utility.crypto.HmacValidator;

import static com.becon.opencelium.backend.constant.SubscriptionConstant.freeLicenseEndDate;

public class LicenseKey {
    private long startDate;
    private long endDate;
    private long operationUsage;
    private String subId;
    private String licenseId;
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
        return endDate == 0 ? freeLicenseEndDate : endDate;
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

    public String getLicenseId() {
        return licenseId;
    }

    public void setLicenseId(String licenseId) {
        this.licenseId = licenseId;
    }

    @Override
    public String toString() {
        return "LicenseKey{" +
                "startDate=" + startDate +
                ", endDate=" + endDate +
                ", operationUsage=" + operationUsage +
                ", subId='" + subId + '\'' +
                ", licenseId='" + licenseId + '\'' +
                ", duration='" + duration + '\'' +
                ", type='" + type + '\'' +
                ", hmac='" + hmac + '\'' +
                '}';
    }
}
