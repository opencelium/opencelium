package com.becon.opencelium.backend.api;

import com.becon.opencelium.backend.api.serviceportal.ServicePortalApi;
import org.springframework.stereotype.Component;

import java.util.HashMap;
import java.util.List;
import java.util.Map;

@Component
public class ApiFactory {
    private final Map<ApiType<?>, ApiClient<?>> byType = new HashMap<>();

    public ApiFactory(List<ApiClient<?>> clients) {
        for (ApiClient<?> c : clients) {
            if (byType.put(c.type(), c) != null) {
                throw new IllegalStateException("Duplicate ApiClient for " + c.type());
            }
        }
    }

    @SuppressWarnings("unchecked")
    public <A> ApiClient<A> get(ApiType<A> type) {
        ApiClient<?> c = byType.get(type);
        if (c == null) throw new IllegalArgumentException("No ApiClient for " + type);
        return (ApiClient<A>) c;
    }
}
