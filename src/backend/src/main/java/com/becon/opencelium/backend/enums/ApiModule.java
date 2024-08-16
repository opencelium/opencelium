package com.becon.opencelium.backend.enums;

import com.becon.opencelium.backend.service_portal.LicenseModule;

public enum ApiModule {
    LICENSE(LicenseModule.class);

    private final Class<?> moduleClass;

    ApiModule(Class<?> moduleClass) {
        this.moduleClass = moduleClass;
    }

    public Class<?> getModuleClass() {
        return moduleClass;
    }
}
