package com.becon.opencelium.backend.subscription.dto;

import com.becon.opencelium.backend.api.ApiClient;
import com.becon.opencelium.backend.api.serviceportal.ServicePortalApi;
import com.becon.opencelium.backend.api.enums.ApiModule;
import com.becon.opencelium.backend.api.module.SubscriptionModule;

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
