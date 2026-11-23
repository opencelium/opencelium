package com.becon.opencelium.backend.resource.connection.methodtest;

import com.becon.opencelium.backend.resource.connection.MethodDTO;
import java.util.Collections;
import java.util.LinkedHashMap;
import java.util.Map;

/**
 * Body of {@code POST /connection/method/curl}.
 *
 * @param method the method to export, as the workflow editor holds it, saved or not
 * @param staticValues values for the references a single method cannot produce (other methods,
 *     webhook, scripts), keyed by the exact reference text, e.g. {@code "#c0ffee.(response).id"};
 *     a value given for a connector reference overrides the connector's data
 */
public record MethodCurlRequestDTO(MethodDTO method, Map<String, Object> staticValues) {

    public MethodCurlRequestDTO {
        // a copy that keeps null values, which Map.copyOf would reject
        staticValues = staticValues == null
                ? Map.of()
                : Collections.unmodifiableMap(new LinkedHashMap<>(staticValues));
    }
}
