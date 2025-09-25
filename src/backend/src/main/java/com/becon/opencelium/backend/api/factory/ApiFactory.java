package com.becon.opencelium.backend.api.factory;

import com.becon.opencelium.backend.api.ApiClient;
import com.becon.opencelium.backend.api.ApiType;
import org.springframework.stereotype.Component;

import java.util.HashMap;
import java.util.List;
import java.util.Map;

/**
 * Central registry for all {@link ApiClient} implementations.
 *
 * <p>New clients are picked up automatically if they are
 * annotated with {@code @Service} and declare an {@link ApiType}.</p>
 */
@Component
public class ApiFactory {
    /** Holds all registered API clients keyed by their type. */
    private final Map<ApiType<?>, ApiClient<?>> byType = new HashMap<>();

    /**
     * Registers all {@link ApiClient} beans provided by Spring.
     *
     * @param clients list of all API client beans
     * @throws IllegalStateException if two clients declare the same {@link ApiType}
     */
    public ApiFactory(List<ApiClient<?>> clients) {
        for (ApiClient<?> c : clients) {
            if (byType.put(c.type(), c) != null) {
                throw new IllegalStateException("Duplicate ApiClient for " + c.type());
            }
        }
    }

    /**
     * Retrieves an API client for the given type.
     *
     * @param type the API type (e.g. {@code ApiType.SERVICE_PORTAL})
     * @param <A>  the feature set exposed by the client
     * @return the matching API client
     * @throws IllegalArgumentException if no client is registered for the given type
     */
    @SuppressWarnings("unchecked")
    public <A> ApiClient<A> get(ApiType<A> type) {
        ApiClient<?> c = byType.get(type);
        if (c == null) throw new IllegalArgumentException("No ApiClient for " + type);
        return (ApiClient<A>) c;
    }
}
