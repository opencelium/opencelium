package com.becon.opencelium.backend.subscription.remoteapi.dto;

import com.becon.opencelium.backend.subscription.remoteapi.RemoteApi;
import com.becon.opencelium.backend.subscription.remoteapi.ServicePortal;
import com.becon.opencelium.backend.subscription.remoteapi.enums.ApiModule;
import com.becon.opencelium.backend.subscription.remoteapi.module.SubscriptionModule;

public class ConnectionStatusDto {
    private String status;
    private String error;

    public String getStatus() {
        RemoteApi remoteApi = new ServicePortal();
        SubscriptionModule sm = remoteApi.getModule(ApiModule.SUBSCRIPTION);
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
