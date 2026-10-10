package io.opencelium.core.testutil.fixture;

import java.nio.charset.StandardCharsets;

/** Invoker files written inline in a test. */
public final class InvokerFiles {

    private InvokerFiles() {
    }

    public static byte[] xml(String text) {
        return text.getBytes(StandardCharsets.UTF_8);
    }
}
