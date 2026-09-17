package io.opencelium.core.invoker.xml;

import io.opencelium.core.invoker.InvokerFormat;
import io.opencelium.core.invoker.ReadResult;
import io.opencelium.core.invoker.InvokerReader;
import io.opencelium.core.invoker.InvokerWriter;
import io.opencelium.common.invoker.Invoker;
import org.junit.jupiter.api.Test;

import java.nio.charset.StandardCharsets;

import static io.opencelium.core.testutil.fixture.InvokerFiles.V5_CMDB_JSONRPC;
import static io.opencelium.core.testutil.fixture.InvokerFiles.V5_GRAPHQL_BASIC;
import static io.opencelium.core.testutil.fixture.InvokerFiles.V5_INVENTORY_PAGED;
import static io.opencelium.core.testutil.fixture.InvokerFiles.V6_SERVICE_DESK;
import static io.opencelium.core.testutil.fixture.InvokerFiles.bytes;
import static org.assertj.core.api.Assertions.assertThat;

class XmlInvokerWriterTest {

    private static final InvokerReader READER = new XmlInvokerReader();
    private final InvokerWriter writer = new XmlInvokerWriter();

    @Test
    void writeProducesAFileThatReadsBackToAnEqualInvoker() {
        Invoker original = READER.read(bytes(V6_SERVICE_DESK)).invoker();

        ReadResult reread = READER.read(writer.write(original));

        assertThat(reread.invoker()).isEqualTo(original);
    }

    @Test
    void writeTurnsEveryUpgradedLegacyInvokerIntoAValidV6File() {
        for (String legacy : new String[] {V5_CMDB_JSONRPC, V5_INVENTORY_PAGED, V5_GRAPHQL_BASIC}) {
            Invoker upgraded = READER.read(bytes(legacy)).invoker();

            ReadResult asV6 = READER.read(writer.write(upgraded));

            assertThat(asV6.format()).as(legacy).isEqualTo(InvokerFormat.V6);
            assertThat(asV6.invoker()).as(legacy).isEqualTo(upgraded);
        }
    }

    @Test
    void writeDeclaresTheFormatVersionWithoutANamespace() {
        String xml = new String(writer.write(READER.read(bytes(V6_SERVICE_DESK)).invoker()), StandardCharsets.UTF_8);

        assertThat(xml).containsPattern("<invoker [^>]*version=\"6\\.0\"").doesNotContain("xmlns");
    }

    @Test
    void writeLeavesOutAttributesThatHoldTheirDefaultValue() {
        String xml = new String(writer.write(READER.read(bytes(V6_SERVICE_DESK)).invoker()), StandardCharsets.UTF_8);

        assertThat(xml).doesNotContain("visibility=\"public\"")
                .doesNotContain("style=\"form\"")
                .doesNotContain("explode=\"true\"")
                .contains("<item name=\"url\">https://acme.example.com</item>")
                .contains("<item name=\"retries\" type=\"integer\">3</item>")
                .contains("explode=\"false\"");
    }
}
