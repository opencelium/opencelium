package com.becon.opencelium.backend.execution.logger;

import jakarta.validation.constraints.NotNull;

public class ThreadLocalOcLogger {
    private static final ThreadLocal<OcLogger<?>> CONTEXT = new ThreadLocal<>();

    private ThreadLocalOcLogger() {
    }

    public static void set(@NotNull OcLogger<?> logger) {
        CONTEXT.set(logger);
    }

    @SuppressWarnings("unchecked")
    public static <T extends LogMessage> OcLogger<T> get() {
        OcLogger<?> logger = CONTEXT.get();

        if (logger == null) {
            throw new IllegalStateException("OcLogger not initialized for current thread");
        }

        return (OcLogger<T>) logger;
    }

    public static void clear() {
        OcLogger<?> logger = CONTEXT.get();
        if (logger != null) {
            logger.clear(); // release resources
        }

        CONTEXT.remove();
    }
}
