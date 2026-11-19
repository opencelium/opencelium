package com.becon.opencelium.backend.execution.globalvariable;

import com.fasterxml.jackson.core.JsonProcessingException;
import com.fasterxml.jackson.databind.ObjectMapper;

import java.util.Collection;
import java.util.Map;

/**
 * Casts the value of a global variable to what the place of use needs.
 *
 * <p>A stored value keeps its JSON type. Where only text fits, in a URL path, a query parameter,
 * a header or inside a longer string, it is cast with {@link #toText(Object)}. A JSON body field
 * that holds nothing but the reference takes the value as it is.
 */
public final class GlobalValueCaster {

    private static final ObjectMapper MAPPER = new ObjectMapper();

    private GlobalValueCaster() {
    }

    /**
     * Returns {@code value} as text: a string as it is, a number or a boolean as its literal, a
     * list or a map as compact JSON text and {@code null} as an empty string.
     */
    public static String toText(Object value) {
        if (value == null) {
            return "";
        }

        if (value instanceof Map<?, ?> || value instanceof Collection<?>) {
            try {
                return MAPPER.writeValueAsString(value);
            } catch (JsonProcessingException e) {
                throw new IllegalStateException("A global variable value could not be written as JSON text", e);
            }
        }

        return value.toString();
    }
}
