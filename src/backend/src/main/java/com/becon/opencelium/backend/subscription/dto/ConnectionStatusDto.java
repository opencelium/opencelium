package com.becon.opencelium.backend.subscription.dto;

public class ConnectionStatusDto {
    private String status;
    private String error;

    public String getStatus() {
//        ApiClient apiClient = new ServicePortalApi();
//        SubscriptionModule sm = (SubscriptionModule) apiClient.getModule(ApiModule.SUBSCRIPTION);
        return status;
    }

    public void setStatus(String status) {
        this.status = status;
    }

    public String getError() {
        return error;
    }

    public void setError(String error) {
        this.error = error;
    }
}
