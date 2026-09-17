package io.opencelium.core.invoker.xml;

import io.opencelium.core.invoker.InvokerFormat;
import io.opencelium.core.invoker.InvokerIssue;
import io.opencelium.core.invoker.InvokerReadException;
import io.opencelium.core.invoker.ReadResult;
import io.opencelium.core.invoker.InvokerReader;
import io.opencelium.common.http.ContentType;
import io.opencelium.common.invoker.Invoker;
import io.opencelium.common.invoker.operation.Operation;
import io.opencelium.common.invoker.operation.OperationId;
import io.opencelium.common.invoker.operation.OperationRole;
import io.opencelium.common.invoker.operation.QueryStyle;
import io.opencelium.common.invoker.operation.ResponseStatus;
import io.opencelium.common.invoker.schema.ArraySchema;
import io.opencelium.common.invoker.schema.ObjectSchema;
import io.opencelium.common.invoker.schema.Value;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.io.TempDir;

import java.nio.file.Files;
import java.nio.file.Path;
import java.util.Map;

import static io.opencelium.core.testutil.fixture.InvokerFiles.V6_SERVICE_DESK;
import static io.opencelium.core.testutil.fixture.InvokerFiles.bytes;
import static io.opencelium.core.testutil.fixture.InvokerFiles.v6WithOperations;
import static io.opencelium.core.testutil.fixture.InvokerFiles.xml;
import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.assertj.core.api.Assertions.catchThrowableOfType;

class XmlInvokerReaderTest {

    private static final InvokerReader READER = new XmlInvokerReader();

    // ── v6 ───────────────────────────────────────────────

    @Test
    void parseReadsEveryConstructWhenFileIsV6() {
        ReadResult parsed = READER.read(bytes(V6_SERVICE_DESK));
        Invoker invoker = parsed.invoker();

        assertThat(parsed.format()).isEqualTo(InvokerFormat.V6);
        assertThat(parsed.upgraded()).isFalse();
        assertThat(parsed.issues()).isEmpty();
        assertThat(invoker.categoryTags()).containsExactly("Ticketing", "Service Desk");
        assertThat(invoker.setting("sessionToken").orElseThrow().source())
                .isEqualTo("%{login.body.result.session-id}");
        assertThat(invoker.operationsWithRole(OperationRole.AUTH)).extracting(Operation::name).containsExactly("login");

        Operation list = invoker.operation(OperationId.of("listTickets")).orElseThrow();
        assertThat(list.request().parameter("status").orElseThrow().explode()).isFalse();
        assertThat(list.request().parameter("ids").orElseThrow().style()).isEqualTo(QueryStyle.PIPE_DELIMITED);
        assertThat(list.pagination().rules()).hasSize(4);
        assertThat(list.responseFor(404)).map(response -> response.status()).contains(ResponseStatus.DEFAULT);

        Operation update = invoker.operation(OperationId.of("cmdb.objects.update")).orElseThrow();
        assertThat(update.request().body().xmlNamespace().prefix()).isEqualTo("cmdb");
        ObjectSchema object = (ObjectSchema) ((ObjectSchema) update.request().body().schema()).field("object")
                .orElseThrow().schema();
        assertThat(object.attributes()).extracting(attribute -> attribute.schema().defaultValue())
                .containsExactly("{objectId}");

        Operation create = invoker.operation(OperationId.of("createTicket")).orElseThrow();
        ArraySchema watchers = (ArraySchema) ((ObjectSchema) create.request().body().schema())
                .field("watchers").orElseThrow().schema();
        assertThat(watchers.defaults()).containsExactly(Value.object(
                Map.entry("email", Value.text("ops@acme.com")), Map.entry("notify", Value.text("true"))));
        assertThat(invoker.operation(OperationId.of("downloadReport")).orElseThrow().responses().getFirst().body()
                .contentType()).isEqualTo(ContentType.parse("application/pdf"));
    }

    @Test
    void parseReportsEverySchemaViolationWithLineNumbers() {
        byte[] file = xml("""
                <invoker version="6.0">
                    <name>X</name>
                    <operations>
                        <operation operationId="a" name="a">
                            <request><method>FETCH</method><endpoint>{url}</endpoint></request>
                            <responses><response status="default"/></responses>
                        </operation>
                    </operations>
                </invoker>
                """);

        InvokerReadException failure = catchThrowableOfType(InvokerReadException.class, () -> READER.read(file));

        assertThat(failure.format()).contains(InvokerFormat.V6);
        assertThat(failure.issues()).hasSizeGreaterThanOrEqualTo(2)
                .allSatisfy(issue -> assertThat(issue.location()).startsWith("line "));
        assertThat(failure.issues()).anySatisfy(issue -> assertThat(issue.message()).contains("'id'"));
        assertThat(failure.issues()).anySatisfy(issue -> assertThat(issue.message()).contains("'FETCH'"));
    }

    @Test
    void parseReportsRuleViolationsInEveryOperationRatherThanStoppingAtTheFirst() {
        byte[] file = v6WithOperations("""
                <operation operationId="a" name="a">
                    <request><method>GET</method><endpoint>{url}/a?x=1</endpoint></request>
                    <responses><response status="default"/></responses>
                </operation>
                <operation operationId="b" name="b">
                    <request><method>GET</method><endpoint>{url}/b</endpoint></request>
                    <responses><response status="4XX"/><response status="4xx"/></responses>
                </operation>
                """);

        InvokerReadException failure = catchThrowableOfType(InvokerReadException.class, () -> READER.read(file));

        assertThat(failure.issues()).containsExactly(
                InvokerIssue.error("/invoker/operations/operation[@operationId='a']/request",
                        "request endpoint '{url}/a?x=1' contains a query string; declare 'x=1' as parameters instead"),
                InvokerIssue.error("/invoker/operations/operation[@operationId='b']",
                        "operation 'b' declares response '4XX' more than once"));
    }

    @Test
    void parseRejectsArrayWithoutItems() {
        byte[] file = v6WithOperations("""
                <operation operationId="a" name="a">
                    <request>
                        <method>POST</method><endpoint>{url}</endpoint>
                        <body contentType="application/json">
                            <schema type="object"><field name="tags" type="array"><value>x</value></field></schema>
                        </body>
                    </request>
                    <responses><response status="default"/></responses>
                </operation>
                """);

        InvokerReadException failure = catchThrowableOfType(InvokerReadException.class, () -> READER.read(file));

        assertThat(failure.issues()).singleElement().satisfies(issue -> {
            assertThat(issue.location()).endsWith("/body/schema/field[@name='tags']");
            assertThat(issue.message())
                    .isEqualTo("an array needs exactly one <items> element describing its elements, but has 0");
        });
    }

    @Test
    void parseRejectsChildElementsTheNodeTypeCannotHave() {
        byte[] file = v6WithOperations("""
                <operation operationId="a" name="a">
                    <request>
                        <method>POST</method><endpoint>{url}</endpoint>
                        <body contentType="application/json">
                            <schema type="string"><field name="oops" type="string"/></schema>
                        </body>
                    </request>
                    <responses><response status="default"/></responses>
                </operation>
                """);

        InvokerReadException failure = catchThrowableOfType(InvokerReadException.class, () -> READER.read(file));

        assertThat(failure.issues()).singleElement().extracting(InvokerIssue::message)
                .isEqualTo("a node of type 'string' cannot contain <field>; it may contain no child elements");
    }

    // ── format detection ─────────────────────────────────

    @Test
    void parseRejectsFileWrittenForANewerMajorVersion() {
        byte[] file = xml("<invoker version=\"7.0\"/>");

        assertThatThrownBy(() -> READER.read(file))
                .isInstanceOf(InvokerReadException.class)
                .hasMessage("/invoker: unsupported invoker format version '7.0'; "
                        + "it was written for a newer version of OpenCelium");
    }

    @Test
    void parseTreatsAFileWithoutAVersionAttributeAsLegacy() {
        byte[] file = xml("<invoker><name>X</name><operations/></invoker>");

        InvokerReadException failure = catchThrowableOfType(InvokerReadException.class, () -> READER.read(file));

        assertThat(failure.format()).contains(InvokerFormat.LEGACY_V5);
    }

    @Test
    void parseRejectsAnInvokerThatDeclaresANamespace() {
        byte[] file = xml("<invoker xmlns=\"http://example.com/invoker\" version=\"6.0\"/>");

        assertThatThrownBy(() -> READER.read(file))
                .isInstanceOf(InvokerReadException.class)
                .hasMessage("/invoker: invoker files do not use an XML namespace; "
                        + "remove the namespace 'http://example.com/invoker' from <invoker>");
    }

    @Test
    void parseRejectsAVersionThatIsNotANumber() {
        assertThatThrownBy(() -> READER.read(xml("<invoker version=\"latest\"/>")))
                .isInstanceOf(InvokerReadException.class)
                .hasMessage("/invoker: 'latest' is not a format version; expected 6.0");
    }

    @Test
    void parseRejectsFileWhoseRootIsNotAnInvoker() {
        assertThatThrownBy(() -> READER.read(xml("<connector/>")))
                .isInstanceOf(InvokerReadException.class)
                .hasMessage("/connector: the root element must be <invoker>, but this file starts with <connector>");
    }

    @Test
    void parseReportsLineAndColumnWhenXmlIsMalformed() {
        InvokerReadException failure = catchThrowableOfType(InvokerReadException.class,
                () -> READER.read(xml("<invoker>\n  <name>X</nam>\n</invoker>")));

        assertThat(failure.issues()).singleElement().extracting(InvokerIssue::location).isEqualTo("line 2, column 12");
        assertThat(failure.format()).isEmpty();
    }

    // ── security ─────────────────────────────────────────

    @Test
    void readRejectsContentOverTheSizeLimitBeforeParsingIt() {
        byte[] huge = new byte[XmlInvokerReader.MAX_CONTENT_BYTES + 1];

        InvokerReadException failure = catchThrowableOfType(InvokerReadException.class, () -> READER.read(huge));

        assertThat(failure.format()).isEmpty();
        assertThat(failure.issues()).containsExactly(InvokerIssue.error("/",
                "the file is larger than the 10485760-byte limit for an invoker file"));
    }

    @Test
    void parseRefusesExternalEntitiesSoAFileCannotReadTheServersDisk(@TempDir Path directory) throws Exception {
        Path secret = Files.writeString(directory.resolve("secret.txt"), "canary-5f2a91");
        byte[] attack = xml("""
                <?xml version="1.0"?>
                <!DOCTYPE invoker [ <!ENTITY leak SYSTEM "%s"> ]>
                <invoker><name>&leak;</name></invoker>
                """.formatted(secret.toUri()));

        InvokerReadException failure = catchThrowableOfType(InvokerReadException.class, () -> READER.read(attack));

        assertThat(failure.issues()).singleElement().extracting(InvokerIssue::message)
                .isEqualTo("DOCTYPE declarations are not allowed in invoker files");
        assertThat(failure).hasMessageNotContaining("canary-5f2a91");
    }

    @Test
    void parseRefusesEntityExpansionBombs() {
        byte[] bomb = xml("""
                <?xml version="1.0"?>
                <!DOCTYPE lolz [<!ENTITY a "aaaaaaaaaa"><!ENTITY b "&a;&a;&a;&a;&a;&a;&a;&a;&a;&a;">]>
                <invoker><name>&b;</name></invoker>
                """);

        assertThatThrownBy(() -> READER.read(bomb))
                .isInstanceOf(InvokerReadException.class)
                .hasMessageContaining("DOCTYPE declarations are not allowed");
    }
}
