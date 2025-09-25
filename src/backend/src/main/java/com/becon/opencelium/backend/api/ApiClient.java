package com.becon.opencelium.backend.api;

import org.springframework.http.ResponseEntity;

/**
 * Generic contract for any API client.
 *
 * <p>This interface defines the common operations that every remote API client must implement:
 * - the ability to check connectivity
 * - the ability to declare which {@link ApiType} it belongs to
 * - the ability to expose its strongly typed feature set (modules available for that API)
 *
 * @param <F> the features type (e.g. {@code ServicePortalFeatures}) that this API client exposes
 */
public interface ApiClient<F> {

    /**
     * Checks connection to a remote API over HTTP.
     *
     * @return true if the connection is successful, false otherwise
     */
    ResponseEntity<String> checkConnection();

    /**
     * Returns the {@link ApiType} that uniquely identifies this client.
     * <p>This ensures the factory can retrieve the correct client implementation
     * for a given API type at runtime.
     *
     * @return the {@link ApiType} instance associated with this client
     */
    ApiType<F> type();

    /**
     * Provides access to the feature set (modules) supported by this API.
     * <p>The generic type {@code F} defines exactly what modules can be used,
     * ensuring compile-time type safety. For example:
     * <pre>
     *     ServicePortalFeatures features = servicePortalClient.features();
     *     features.invoker().invoke(...);
     * </pre>
     *
     * @return the strongly-typed features object for this API
     */
    F features(); // exposes only allowed features
}
