package io.opencelium.core.testutil.fixture;

import java.io.IOException;
import java.io.InputStream;
import java.io.UncheckedIOException;
import java.nio.charset.StandardCharsets;

/** Invoker files from {@code src/test/resources/invoker}, and files written inline in a test. */
public final class InvokerFiles {

    /** A v6 invoker with every part of the header filled in and every kind of setting. */
    public static final String V6_SERVICE_DESK = "v6/service-desk.xml";

    private InvokerFiles() {
    }

    public static byte[] bytes(String name) {
        try (InputStream in = InvokerFiles.class.getResourceAsStream("/invoker/" + name)) {
            if (in == null) {
                throw new IllegalArgumentException("no invoker fixture " + name);
            }
            return in.readAllBytes();
        } catch (IOException e) {
            throw new UncheckedIOException(e);
        }
    }

    public static byte[] xml(String text) {
        return text.getBytes(StandardCharsets.UTF_8);
    }

    /** A minimal valid v6 file whose requiredData can be replaced. */
    public static byte[] v6WithSettings(String settings) {
        return xml("""
                <invoker version="6.0" id="minimal">
                    <name>Minimal</name>
                    <requiredData>
                %s
                    </requiredData>
                </invoker>
                """.formatted(settings));
    }

    /** The smallest valid v6 file: an id and a name. */
    public static byte[] v6Minimal() {
        return xml("""
                <invoker version="6.0" id="minimal">
                    <name>Minimal</name>
                </invoker>
                """);
    }
}
