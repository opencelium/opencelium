package com.becon.opencelium.backend.factory;

import com.becon.opencelium.backend.enums.ApiModule;
import com.becon.opencelium.backend.enums.ApiType;
import com.becon.opencelium.backend.service_portal.LicenseModule;
import com.becon.opencelium.backend.service_portal.RemoteApi;
import com.becon.opencelium.backend.service_portal.ServicePortal;

public class RemoteApiFactory {
    private RemoteApiFactory() {}

    public static RemoteApi createInstance(ApiType type, ApiModule apiModule) {
        return switch (type) {
            case SERVICE_PORTAL -> {
                if (apiModule.getModuleClass() == LicenseModule.class) {
                    yield ServicePortal.getInstance();
                }
                // other modules
                else {
                    throw new IllegalArgumentException("Invalid api module type");
                }
            }
        };
    }
}
