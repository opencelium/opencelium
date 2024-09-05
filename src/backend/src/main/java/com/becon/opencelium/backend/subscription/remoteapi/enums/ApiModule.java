package com.becon.opencelium.backend.subscription.remoteapi.enums;

import com.becon.opencelium.backend.subscription.remoteapi.module.SubscriptionModule;

public enum ApiModule {
    SUBSCRIPTION(SubscriptionModule.class);

    private final Class<?> moduleClass;

    ApiModule(Class<?> moduleClass) {
        this.moduleClass = moduleClass;
    }

    /**
     * Returns the module class.
     *
     * @return the module class
     */
    public Class<?> getModuleClass() {
        return moduleClass;
    }
}
