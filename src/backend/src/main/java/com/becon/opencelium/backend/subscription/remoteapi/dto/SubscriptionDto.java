package com.becon.opencelium.backend.subscription.remoteapi.dto;

public class SubscriptionDto {
    private String _id;
    private String type;
    private String duration;
    private int startDate;
    private int endDate;
    private long operationUsage;

    public String get_id() {
        return _id;
    }

    public void set_id(String _id) {
        this._id = _id;
    }

    public String getType() {
        return type;
    }

    public void setType(String type) {
        this.type = type;
    }

    public String getDuration() {
        return duration;
    }

    public void setDuration(String duration) {
        this.duration = duration;
    }

    public int getStartDate() {
        return startDate;
    }

    public void setStartDate(int startDate) {
        this.startDate = startDate;
    }

    public int getEndDate() {
        return endDate;
    }

    public void setEndDate(int endDate) {
        this.endDate = endDate;
    }

    public long getOperationUsage() {
        return operationUsage;
    }

    public void setOperationUsage(long operationUsage) {
        this.operationUsage = operationUsage;
    }
}
