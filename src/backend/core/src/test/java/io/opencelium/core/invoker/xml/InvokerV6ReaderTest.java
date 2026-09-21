package io.opencelium.core.invoker.xml;

import io.opencelium.core.invoker.InvokerFormat;
import io.opencelium.core.invoker.InvokerIssue;
import io.opencelium.core.invoker.InvokerReadException;
import io.opencelium.common.http.ContentType;
import io.opencelium.common.invoker.Invoker;
import io.opencelium.common.invoker.operation.Operation;
import io.opencelium.common.invoker.operation.OperationRole;
import io.opencelium.common.invoker.operation.QueryParameter;
import io.opencelium.common.invoker.operation.QueryStyle;
import io.opencelium.common.invoker.operation.ResponseStatus;
import io.opencelium.common.invoker.operation.SuccessCondition;
import io.opencelium.common.invoker.schema.ArraySchema;
import io.opencelium.common.invoker.schema.ObjectSchema;
import io.opencelium.common.invoker.schema.ScalarType;
import io.opencelium.common.invoker.schema.Value;
import io.opencelium.common.invoker.setting.ConnectorSetting;
import org.junit.jupiter.api.Test;

import java.util.Map;

import static io.opencelium.core.testutil.fixture.InvokerFiles.V6_SERVICE_DESK;
import static io.opencelium.core.testutil.fixture.InvokerFiles.bytes;
import static io.opencelium.core.testutil.fixture.InvokerFiles.v6WithOperations;
import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.catchThrowableOfType;
import static org.assertj.core.api.Assertions.tuple;

class InvokerV6ReaderTest {

    private static final InvokerV6Reader READER = new InvokerV6Reader(SecureXml.loadSchema("/invoker-6.0.xsd"));

    private static Invoker read(byte[] xml) {
        return READER.read(SecureXml.parse(xml), xml);
    }

    private static InvokerReadException failure(byte[] xml) {
        return catchThrowableOfType(InvokerReadException.class, () -> read(xml));
    }

    private static Operation serviceDesk(String operationId) {
        return read(bytes(V6_SERVICE_DESK)).operation(operationId).orElseThrow();
    }

    // ── invoker and settings ─────────────────────────────

    @Test
    void readMapsTheInvokerHeader() {
        Invoker invoker = read(bytes(V6_SERVICE_DESK));

        assertThat(invoker.id()).isEqualTo("example-service-desk");
        assertThat(invoker.name()).isEqualTo("Example Service Desk");
        assertThat(invoker.authType()).isEqualTo("token");
        assertThat(invoker.categoryTags()).containsExactlyInAnyOrder("Ticketing", "Service Desk");
        assertThat(invoker.operations()).hasSize(6);
    }

    @Test
    void readAppliesSettingDefaultsForTypeAndVisibility() {
        Invoker invoker = read(bytes(V6_SERVICE_DESK));

        assertThat(invoker.settings()).contains(
                new ConnectorSetting("url", ScalarType.STRING, "public", "https://acme.example.com", null),
                new ConnectorSetting("retries", ScalarType.INTEGER, "public", "3", null),
                new ConnectorSetting("sessionToken", ScalarType.STRING, "private", null,
                        "%{login.body.result.session-id}"));
    }

    // ── operations ───────────────────────────────────────

    @Test
    void readParsesRolesAndSuccessConditions() {
        Operation login = serviceDesk("login");

        assertThat(login.roles()).containsExactlyInAnyOrder(OperationRole.TEST, OperationRole.AUTH);
        assertThat(login.summary()).isEqualTo("Exchange credentials for a session token");
        assertThat(login.responses().getFirst().condition()).isEqualTo(SuccessCondition.of("body.error == null"));
        assertThat(login.responses()).extracting(response -> response.status().value()).containsExactly("200", "5XX");
    }

    @Test
    void readAppliesOpenApiDefaultsToQueryParameters() {
        Operation list = serviceDesk("listTickets");

        assertThat(list.request().parameters()).extracting(QueryParameter::name, QueryParameter::style,
                        QueryParameter::explode)
                .containsExactly(
                        tuple("limit", QueryStyle.FORM, true),
                        tuple("status", QueryStyle.FORM, false),
                        tuple("ids", QueryStyle.PIPE_DELIMITED, false),
                        tuple("filter", QueryStyle.DEEP_OBJECT, false));
    }

    @Test
    void readMapsPaginationRulesInDeclarationOrder() {
        Operation list = serviceDesk("listTickets");

        assertThat(list.pagination().rules()).extracting(rule -> rule.param().value())
                .containsExactly("limit", "offset", "size", "result");
        assertThat(list.responses()).extracting(response -> response.status())
                .containsExactly(ResponseStatus.of(200), ResponseStatus.DEFAULT);
    }

    @Test
    void readMapsArrayDefaultsAsValues() {
        ObjectSchema body = (ObjectSchema) serviceDesk("createTicket").request().body().schema();

        ArraySchema watchers = (ArraySchema) body.field("watchers").orElseThrow().schema();

        assertThat(watchers.defaults()).containsExactly(Value.object(
                Map.entry("email", Value.text("ops@acme.com")), Map.entry("notify", Value.text("true"))));
    }

    @Test
    void readMapsXmlNamespaceAndAttributes() {
        var body = serviceDesk("cmdb.objects.update").request().body();

        ObjectSchema object = (ObjectSchema) ((ObjectSchema) body.schema()).field("object").orElseThrow().schema();

        assertThat(body.xmlNamespace().uri()).isEqualTo("http://acme.com/cmdb/v1");
        assertThat(body.xmlNamespace().prefix()).isEqualTo("cmdb");
        assertThat(object.attributes()).extracting(attribute -> attribute.schema().defaultValue())
                .containsExactly("{objectId}");
    }

    @Test
    void readKeepsAnOpaqueBodyWithoutSchema() {
        var body = serviceDesk("downloadReport").responses().getFirst().body();

        assertThat(body.contentType()).isEqualTo(ContentType.parse("application/pdf"));
        assertThat(body.schema()).isNull();
    }

    @Test
    void readKeepsTheGraphqlEnvelope() {
        assertThat(serviceDesk("search").request().body().envelope()).isEqualTo("graphql");
    }

    // ── rejection ────────────────────────────────────────

    @Test
    void readReportsRuleViolationsInEveryOperationRatherThanStoppingAtTheFirst() {
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

        InvokerReadException failure = failure(file);

        assertThat(failure.format()).contains(InvokerFormat.V6);
        assertThat(failure.issues()).containsExactly(
                InvokerIssue.error("/invoker/operations/operation[@operationId='a']/request",
                        "request endpoint '{url}/a?x=1' contains a query string; declare 'x=1' as parameters instead"),
                InvokerIssue.error("/invoker/operations/operation[@operationId='b']",
                        "operation 'b' declares response '4XX' more than once"));
    }

    @Test
    void readRejectsTwoOperationsWithTheSameId() {
        byte[] file = v6WithOperations("""
                <operation operationId="a" name="first">
                    <request><method>GET</method><endpoint>{url}</endpoint></request>
                    <responses><response status="default"/></responses>
                </operation>
                <operation operationId="a" name="second">
                    <request><method>GET</method><endpoint>{url}</endpoint></request>
                    <responses><response status="default"/></responses>
                </operation>
                """);

        assertThat(failure(file).issues()).containsExactly(InvokerIssue.error("/invoker",
                "invoker 'minimal' declares operation 'a' more than once"));
    }

    @Test
    void readRejectsArrayWithoutItems() {
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

        assertThat(failure(file).issues()).singleElement().satisfies(issue -> {
            assertThat(issue.location()).endsWith("/body/schema/field[@name='tags']");
            assertThat(issue.message())
                    .isEqualTo("an array needs exactly one <items> element describing its elements, but has 0");
        });
    }

    @Test
    void readRejectsChildElementsTheNodeTypeCannotHave() {
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

        assertThat(failure(file).issues()).singleElement().extracting(InvokerIssue::message)
                .isEqualTo("a node of type 'string' cannot contain <field>; it may contain no child elements");
    }

    @Test
    void readRejectsAPrefixWithoutATargetNamespace() {
        byte[] file = v6WithOperations("""
                <operation operationId="a" name="a">
                    <request>
                        <method>POST</method><endpoint>{url}</endpoint>
                        <body contentType="application/xml">
                            <schema type="object" prefix="x"><field name="id" type="string"/></schema>
                        </body>
                    </request>
                    <responses><response status="default"/></responses>
                </operation>
                """);

        assertThat(failure(file).issues()).singleElement().extracting(InvokerIssue::message)
                .isEqualTo("a prefix needs a targetNamespace to bind to");
    }

    @Test
    void readReportsSchemaViolationsBeforeMappingTheModel() {
        byte[] file = v6WithOperations("""
                <operation operationId="a" name="a">
                    <request><method>FETCH</method><endpoint>{url}</endpoint></request>
                    <responses><response status="default"/></responses>
                </operation>
                """);

        InvokerReadException failure = failure(file);

        assertThat(failure.issues()).allSatisfy(issue -> assertThat(issue.location()).startsWith("line "));
        assertThat(failure.issues()).anySatisfy(issue -> assertThat(issue.message()).contains("'FETCH'"));
    }
}
