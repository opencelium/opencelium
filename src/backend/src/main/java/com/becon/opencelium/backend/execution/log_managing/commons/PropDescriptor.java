package com.becon.opencelium.backend.execution.log_managing.commons;

import java.util.function.Function;

public class PropDescriptor {
    private final String key;
    private final boolean required;
    private final Function<String, Object> valueParser;

    public PropDescriptor(String key, boolean required, Function<String, Object> valueParser) {
        this.key = key;
        this.required = required;
        this.valueParser = valueParser;
    }

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

    public String key() {
        return key;
    }

    public boolean required() {
        return required;
    }

    public Function<String, Object> getValueParser() {
        return valueParser;
    }
}
