package com.becon.opencelium.backend.api;

import com.becon.opencelium.backend.api.serviceportal.ServicePortal;

public record ApiType<F>(String name, Class<F> featuresClass) {

    @Override
    public boolean equals(Object o) {
        return (o instanceof ApiType<?> other) && this.name.equals(other.name);
    }

    @Override
    public int hashCode() {
        return name.hashCode();
    }

    @Override
    public String toString() {
        return "ApiType[" + name + "]";
    }

    // Known APIs
    public static final ApiType<ServicePortal> SERVICE_PORTAL =
            new ApiType<>("SERVICE_PORTAL", ServicePortal.class);
}
