package com.becon.opencelium.backend.execution.log_managing.commons;

public record PropDescriptor(String key, boolean required) {
    public static PropDescriptor of(String key, boolean required) {
        return new PropDescriptor(key, required);
    }

    public static PropDescriptor of(String key) {
        return new PropDescriptor(key, true);
    }

}
