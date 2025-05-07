package com.becon.opencelium.backend.execution.log_managing.commons;

import java.util.function.Function;

public record PropDescriptor(String key, boolean required, Function<String, Object> valueParser) {

    public static PropDescriptor of(String key, boolean required) {
        return new PropDescriptor(key, required, x -> x);
    }

    public static PropDescriptor of(String key) {
        return new PropDescriptor(key, true, x -> x);
    }

    public static PropDescriptor of(String key, boolean required, Function<String, Object> valueParser) {
        return new PropDescriptor(key, required, valueParser);
    }

    public static PropDescriptor of(String key, Function<String, Object> valueParser) {
        return new PropDescriptor(key, true, valueParser);
    }
}
