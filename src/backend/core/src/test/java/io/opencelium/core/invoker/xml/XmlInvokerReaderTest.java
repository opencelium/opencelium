package io.opencelium.core.invoker.xml;

import io.opencelium.common.invoker.Invoker;
import io.opencelium.core.invoker.InvokerFormat;
import io.opencelium.core.invoker.InvokerIssue;
import io.opencelium.core.invoker.InvokerReadException;
import io.opencelium.core.invoker.InvokerReader;
import io.opencelium.core.invoker.ReadResult;
import org.junit.jupiter.api.Test;

import static io.opencelium.core.testutil.fixture.InvokerFiles.V6_SERVICE_DESK;
import static io.opencelium.core.testutil.fixture.InvokerFiles.bytes;
import static io.opencelium.core.testutil.fixture.InvokerFiles.v6Minimal;
import static io.opencelium.core.testutil.fixture.InvokerFiles.xml;
import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.catchThrowableOfType;

class XmlInvokerReaderTest {

    private static final InvokerReader READER = new XmlInvokerReader(new XmlInvokerParser());

    private static InvokerReadException failure(byte[] file) {
        return catchThrowableOfType(InvokerReadException.class, () -> READER.read(file));
    }

    // ── the invoker ──────────────────────────────────────

    @Test
    void readMapsEveryPartOfTheInvokerHeader() {
        ReadResult result = READER.read(bytes(V6_SERVICE_DESK));
        Invoker invoker = result.invoker();

        assertThat(result.format()).isEqualTo(InvokerFormat.V6);
        assertThat(result.upgraded()).isFalse();
        assertThat(result.issues()).isEmpty();
        assertThat(invoker.id()).isEqualTo("example-service-desk");
        assertThat(invoker.name()).isEqualTo("Example Service Desk");
        assertThat(invoker.description()).isEqualTo("Reference invoker used by the tests.");
        assertThat(invoker.hint()).isEqualTo("Enter your instance URL.");
        assertThat(invoker.icon()).isEqualTo("service-desk.png");
        assertThat(invoker.authType()).isEqualTo("token");
        assertThat(invoker.categoryTags()).containsExactlyInAnyOrder("Ticketing", "Service Desk");
    }

    @Test
    void readLeavesOptionalPartsNullWhenTheFileOmitsThem() {
        Invoker invoker = READER.read(v6Minimal()).invoker();

        assertThat(invoker.id()).isEqualTo("minimal");
        assertThat(invoker.name()).isEqualTo("Minimal");
        assertThat(invoker.description()).isNull();
        assertThat(invoker.hint()).isNull();
        assertThat(invoker.icon()).isNull();
        assertThat(invoker.authType()).isNull();
        assertThat(invoker.categoryTags()).isEmpty();
    }

    @Test
    void readKeepsACategoryTagOnlyOnceWhenItIsRepeated() {
        byte[] file = xml("""
                <invoker version="6.0" id="minimal">
                    <name>Minimal</name>
                    <category_tags>
                        <item>Ticketing</item>
                        <item>Ticketing</item>
                    </category_tags>
                </invoker>
                """);

        assertThat(READER.read(file).invoker().categoryTags()).containsExactly("Ticketing");
    }

    // ── the file itself ──────────────────────────────────

    @Test
    void readReportsEverySchemaViolationWithLineNumbers() {
        byte[] file = xml("""
                <invoker version="6.0">
                    <name>X</name>
                    <summary>not part of the format</summary>
                </invoker>
                """);

        InvokerReadException failure = failure(file);

        assertThat(failure.format()).contains(InvokerFormat.V6);
        assertThat(failure.issues()).hasSizeGreaterThanOrEqualTo(2)
                .allSatisfy(issue -> assertThat(issue.location()).startsWith("line "));
        assertThat(failure.issues()).anySatisfy(issue -> assertThat(issue.message()).contains("'id'"));
        assertThat(failure.issues()).anySatisfy(issue -> assertThat(issue.message()).contains("'summary'"));
    }

    @Test
    void readRejectsAnInvokerWithABlankName() {
        byte[] file = xml("<invoker version=\"6.0\" id=\"minimal\"><name>   </name></invoker>");

        assertThat(failure(file).issues())
                .allSatisfy(issue -> assertThat(issue.location()).isEqualTo("line 1, column 53"))
                .anySatisfy(issue -> assertThat(issue.message()).contains("of element 'name' is not valid"));
    }

    @Test
    void readRejectsALegacyFileUntilTheLegacyReaderExists() {
        byte[] file = xml("<invoker type=\"RESTful\"><name>Demo CMDB</name></invoker>");

        InvokerReadException failure = failure(file);

        assertThat(failure.format()).contains(InvokerFormat.LEGACY_V5);
        assertThat(failure.issues()).singleElement().extracting(InvokerIssue::message)
                .isEqualTo("5.x invoker files cannot be read yet; save the file in format 6.0");
    }
}
