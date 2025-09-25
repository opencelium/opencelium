package com.becon.opencelium.backend.api;

import com.becon.opencelium.backend.api.serviceportal.ServicePortal;

/**
 * Represents a unique API type with its associated feature set.
 *
 * <p>To add a new API:</p>
 * <ul>
 *   <li>Define a features interface (e.g. {@code NewApiInterface}).</li>
 *   <li>Implement {@link ApiClient} with {@code @NewApiInterface}.</li>
 *   <li>Declare a new constant here (e.g. #NEW_API).</li>
 * </ul>
 *
 * @param <F> the feature interface type (e.g. ServicePortal)
 */
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

    /** Service Portal API type */
    public static final ApiType<ServicePortal> SERVICE_PORTAL =
            new ApiType<>("SERVICE_PORTAL", ServicePortal.class);
}
