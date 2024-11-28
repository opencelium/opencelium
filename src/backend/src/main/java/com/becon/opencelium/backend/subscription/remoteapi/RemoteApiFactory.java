package com.becon.opencelium.backend.subscription.remoteapi;

import com.becon.opencelium.backend.subscription.remoteapi.enums.ApiType;

public class RemoteApiFactory {
    private RemoteApiFactory() {
        // Private constructor to prevent instantiation
    }

    public static RemoteApi createInstance(ApiType apiType) {
        switch (apiType) {
            case SERVICE_PORTAL:
                // Return an instance of ServicePortal
                return new ServicePortal(); // Adjust constructor parameters accordingly
            default:
                throw new IllegalArgumentException("Unsupported API type: " + apiType);
        }
    }
}
