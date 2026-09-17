package io.opencelium.core.testutil.fixture;

import java.io.IOException;
import java.io.InputStream;
import java.io.UncheckedIOException;
import java.nio.charset.StandardCharsets;

/** Invoker files from {@code src/test/resources/invoker}. */
public final class InvokerFiles {

    /** A v6 invoker using every construct of the format. */
    public static final String V6_SERVICE_DESK = "v6/service-desk.xml";

    /** A 5.x JSON-RPC invoker whose success and fail responses share status 200. */
    public static final String V5_CMDB_JSONRPC = "v5/cmdb-jsonrpc.xml";

    /** A 5.x invoker with invoker-level and operation-level pagination. */
    public static final String V5_INVENTORY_PAGED = "v5/inventory-paged.xml";

    /** A 5.x GraphQL invoker using HTTP Basic credentials, named {@code fake api}. */
    public static final String V5_GRAPHQL_BASIC = "v5/graphql-basic.xml";

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

    /** A minimal valid v6 file with one operation, whose operation element can be replaced. */
    public static byte[] v6WithOperations(String operations) {
        return xml("""
                <invoker version="6.0" id="minimal">
                    <name>Minimal</name>
                    <operations>
                %s
                    </operations>
                </invoker>
                """.formatted(operations));
    }

    /** A minimal 5.x file whose requiredData and operations can be replaced. */
    public static byte[] v5With(String requiredData, String operations) {
        return xml("""
                <invoker type="RESTful">
                    <name>Legacy</name>
                    <requiredData>%s</requiredData>
                    <operations>%s</operations>
                </invoker>
                """.formatted(requiredData, operations));
    }

    /** A minimal 5.x operation that answers 200 with no body. */
    public static String v5Operation(String name) {
        return """
                <operation name="%s" type="">
                    <request><method>GET</method><endpoint>{url}/%s</endpoint></request>
                    <response><success status="200"/></response>
                </operation>
                """.formatted(name, name);
    }
}
