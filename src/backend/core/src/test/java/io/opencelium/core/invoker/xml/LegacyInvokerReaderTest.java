package io.opencelium.core.invoker.xml;

import io.opencelium.core.invoker.InvokerIssue;
import io.opencelium.core.invoker.InvokerReadException;
import io.opencelium.core.invoker.ReadResult;
import io.opencelium.core.invoker.InvokerReader;
import io.opencelium.common.http.ContentType;
import io.opencelium.common.invoker.Invoker;
import io.opencelium.common.invoker.InvokerId;
import io.opencelium.common.invoker.operation.Body;
import io.opencelium.common.invoker.operation.BodyEnvelope;
import io.opencelium.common.invoker.operation.Operation;
import io.opencelium.common.invoker.operation.OperationId;
import io.opencelium.common.invoker.operation.OperationRole;
import io.opencelium.common.invoker.operation.QueryParameter;
import io.opencelium.common.invoker.operation.Response;
import io.opencelium.common.invoker.operation.ResponseStatus;
import io.opencelium.common.invoker.pagination.PageAction;
import io.opencelium.common.invoker.pagination.PageParam;
import io.opencelium.common.invoker.pagination.PageRule;
import io.opencelium.common.invoker.schema.ArraySchema;
import io.opencelium.common.invoker.schema.Field;
import io.opencelium.common.invoker.schema.ObjectSchema;
import io.opencelium.common.invoker.schema.Schema;
import io.opencelium.common.invoker.schema.UndefinedSchema;
import io.opencelium.common.invoker.schema.Value;
import io.opencelium.common.invoker.setting.ConnectorSetting;
import io.opencelium.common.invoker.setting.Visibility;
import org.junit.jupiter.api.Test;

import static io.opencelium.core.testutil.fixture.InvokerFiles.V5_CMDB_JSONRPC;
import static io.opencelium.core.testutil.fixture.InvokerFiles.V5_GRAPHQL_BASIC;
import static io.opencelium.core.testutil.fixture.InvokerFiles.V5_INVENTORY_PAGED;
import static io.opencelium.core.testutil.fixture.InvokerFiles.bytes;
import static io.opencelium.core.testutil.fixture.InvokerFiles.v5Operation;
import static io.opencelium.core.testutil.fixture.InvokerFiles.v5With;
import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.catchThrowableOfType;

class LegacyInvokerReaderTest {

    private static final InvokerReader READER = new XmlInvokerReader();

    // Parsed per test rather than in fields, so a regression in one fixture fails only the tests using it.
    private static ReadResult cmdb() {
        return READER.read(bytes(V5_CMDB_JSONRPC));
    }

    private static ReadResult inventory() {
        return READER.read(bytes(V5_INVENTORY_PAGED));
    }

    private static ReadResult graphql() {
        return READER.read(bytes(V5_GRAPHQL_BASIC));
    }

    // ── identity ─────────────────────────────────────────

    @Test
    void readDerivesTheInvokerIdFromTheNameAndReportsIt() {
        ReadResult cmdb = cmdb();
        ReadResult inventory = inventory();

        assertThat(cmdb.upgraded()).isTrue();
        assertThat(cmdb.invoker().id()).isEqualTo(InvokerId.of("demo-cmdb"));
        assertThat(inventory.invoker().id()).isEqualTo(InvokerId.of("demo-inventory"));
        assertThat(cmdb.issues()).contains(InvokerIssue.info("/invoker/name", "derived the invoker id 'demo-cmdb' "
                + "from the name 'Demo CMDB'; connectors refer to the invoker by this id, which must not change"));
    }

    @Test
    void readKeepsCategoryTags() {
        ReadResult cmdb = cmdb();

        assertThat(cmdb.invoker().categoryTags()).containsExactly("CMDB", "Asset Management");
    }

    @Test
    void readIgnoresTheRootTypeAttributeBecause5xNeverUsedIt() {
        String withoutType = new String(v5With("", v5Operation("list")), java.nio.charset.StandardCharsets.UTF_8)
                .replace("<invoker type=\"RESTful\">", "<invoker>");
        String withNonsenseType = withoutType.replace("<invoker>", "<invoker type=\"SOAP-ish\">");

        ReadResult plain = READER.read(withoutType.getBytes(java.nio.charset.StandardCharsets.UTF_8));
        ReadResult typed = READER.read(withNonsenseType.getBytes(java.nio.charset.StandardCharsets.UTF_8));

        assertThat(withNonsenseType).contains("type=\"SOAP-ish\"");
        assertThat(typed.invoker()).isEqualTo(plain.invoker());
        assertThat(typed.issues()).isEqualTo(plain.issues());
    }

    @Test
    void readKeepsDottedOperationNamesAsIdsAndReplacesInvalidCharacters() {
        ReadResult cmdb = cmdb();
        ReadResult inventory = inventory();

        assertThat(cmdb.invoker().operation(OperationId.of("cmdb.objects.read"))).isPresent();
        assertThat(inventory.invoker().operation(OperationId.of("Get-All-Computers")))
                .map(Operation::name).contains("Get All Computers");
    }

    // ── settings ─────────────────────────────────────────

    @Test
    void readKeepsAPrivateReferenceAsItsSourceExactlyAsWritten() {
        ReadResult cmdb = cmdb();

        assertThat(cmdb.invoker().setting("sessionid").orElseThrow())
                .isEqualTo(ConnectorSetting.ofPrivate("sessionid", "%{login.body.result.session-id}"));
    }

    @Test
    void readKeepsBasicCredentialsAsWrittenIncludingTheBasicPrefix() {
        ReadResult graphql = graphql();

        assertThat(graphql.invoker().setting("token").orElseThrow().source()).isEqualTo("Basic {username:password}");
        assertThat(graphql.issues()).noneSatisfy(issue ->
                assertThat(issue.location()).isEqualTo("/invoker/requiredData/item[@name='token']"));
    }

    @Test
    void readKeepsAPrivateFixedValueAsItsSourceForTheEngineToResolve() {
        ReadResult inventory = inventory();

        assertThat(inventory.invoker().setting("grant").orElseThrow())
                .isEqualTo(ConnectorSetting.ofPrivate("grant", "client_credentials"));
    }

    @Test
    void readUpdatesAReferenceToAnOperationWhoseNameHadToBecomeAnId() {
        byte[] file = v5With(
                "<item name=\"token\" type=\"string\" visibility=\"private\">Bearer %{Get Token.body.token}</item>",
                v5Operation("Get Token"));

        ReadResult parsed = READER.read(file);

        assertThat(parsed.invoker().setting("token").orElseThrow().source()).isEqualTo("Bearer %{Get-Token.body.token}");
        assertThat(parsed.issues()).contains(InvokerIssue.info("/invoker/requiredData/item[@name='token']",
                "updated the reference to the operation 'Get Token', which was given the id 'Get-Token'"));
    }

    @Test
    void readKeepsAReferenceToAnUnknownOperationForTheEngineToReport() {
        byte[] file = v5With(
                "<item name=\"token\" type=\"string\" visibility=\"private\">%{login.body.token}</item>",
                v5Operation("list"));

        assertThat(READER.read(file).invoker().setting("token").orElseThrow().source()).isEqualTo("%{login.body.token}");
    }

    @Test
    void readRejectsAPrivateSettingWithNothingToDeriveItFrom() {
        byte[] file = v5With("<item name=\"token\" type=\"string\" visibility=\"private\"/>", v5Operation("list"));

        InvokerReadException failure = catchThrowableOfType(InvokerReadException.class, () -> READER.read(file));

        assertThat(failure.issues()).contains(InvokerIssue.error("/invoker/requiredData/item[@name='token']",
                "the private setting 'token' has no value to derive it from"));
    }

    // ── requests ─────────────────────────────────────────

    @Test
    void readMovesTheContentTypeHeaderOntoTheBody() {
        ReadResult cmdb = cmdb();

        Operation login = cmdb.invoker().operation(OperationId.of("login")).orElseThrow();

        assertThat(login.request().header("Content-Type")).isEmpty();
        assertThat(login.request().body().contentType()).isEqualTo(ContentType.APPLICATION_JSON);
        assertThat(login.hasRole(OperationRole.TEST)).isTrue();
    }

    @Test
    void readLiftsTheQueryStringOutOfTheEndpoint() {
        ReadResult cmdb = cmdb();

        Operation read = cmdb.invoker().operation(OperationId.of("cmdb.objects.read")).orElseThrow();

        assertThat(read.request().endpoint()).isEqualTo("{url}/objects");
        assertThat(read.request().parameters()).extracting(QueryParameter::name).containsExactly("include", "limit");
    }

    @Test
    void readKeepsTheGraphqlEnvelopeOnRequestsOnly() {
        ReadResult graphql = graphql();

        Operation query = graphql.invoker().operation(OperationId.of("Query")).orElseThrow();

        assertThat(query.request().body().envelope()).isEqualTo(BodyEnvelope.GRAPHQL);
        assertThat(query.responseFor(200).orElseThrow().body().envelope()).isNull();
    }

    @Test
    void readTurnsOcAttributesIntoXmlAttributesAndWarnsAboutElementText() {
        ReadResult graphql = graphql();

        Body body = graphql.invoker().operation(OperationId.of("Ticket")).orElseThrow().request().body();
        ObjectSchema ticket = (ObjectSchema) ((ObjectSchema) body.schema()).field("ticket").orElseThrow().schema();

        assertThat(body.contentType()).isEqualTo(ContentType.APPLICATION_XML);
        assertThat(ticket.attributes()).extracting(attribute -> attribute.name() + "=" + attribute.schema().defaultValue())
                .containsExactly("id=7");
        assertThat(ticket.field("__oc__value")).isEmpty();
        assertThat(graphql.issues()).anySatisfy(issue ->
                assertThat(issue.location()).endsWith("field[@name='__oc__value']"));
    }

    // ── responses ────────────────────────────────────────

    @Test
    void readMergesSuccessAndFailSharingAStatusAndWarnsThatAConditionIsNeeded() {
        ReadResult cmdb = cmdb();

        Operation login = cmdb.invoker().operation(OperationId.of("login")).orElseThrow();

        assertThat(login.responses()).singleElement().satisfies(response -> {
            assertThat(response.status()).isEqualTo(ResponseStatus.of(200));
            assertThat(((ObjectSchema) response.body().schema()).fields()).extracting(Field::name)
                    .containsExactly("jsonrpc", "result", "error");
        });
        assertThat(cmdb.issues()).anySatisfy(issue -> {
            assertThat(issue.severity()).isEqualTo(InvokerIssue.Severity.WARNING);
            assertThat(issue.message()).startsWith("success and fail both answer status 200");
        });
    }

    @Test
    void readDropsExampleValuesFromResponseSchemas() {
        ReadResult cmdb = cmdb();

        Response login = cmdb.invoker().operation(OperationId.of("login")).orElseThrow().responses().getFirst();

        assertThat(((ObjectSchema) login.body().schema()).field("jsonrpc").orElseThrow().schema())
                .isEqualTo(Schema.string());
    }

    @Test
    void readKeepsDistinctStatusesAsSeparateResponses() {
        ReadResult cmdb = cmdb();

        Operation read = cmdb.invoker().operation(OperationId.of("cmdb.objects.read")).orElseThrow();

        assertThat(read.responses()).extracting(response -> response.status().value()).containsExactly("200", "404");
    }

    @Test
    void readDescribesArraysByShapeWhatever5xSpellingWasUsed() {
        ReadResult cmdb = cmdb();

        ObjectSchema body = (ObjectSchema) cmdb.invoker().operation(OperationId.of("cmdb.objects.read")).orElseThrow()
                .responseFor(200).orElseThrow().body().schema();

        assertThat(((ArraySchema) body.field("result").orElseThrow().schema()).items())
                .isInstanceOf(ObjectSchema.class);
        assertThat(((ArraySchema) body.field("ids").orElseThrow().schema()).items())
                .isEqualTo(UndefinedSchema.INSTANCE);
        assertThat(body.field("tags").orElseThrow().schema()).isEqualTo(Schema.arrayOf(Schema.string()));
    }

    @Test
    void readTreatsAnArrayTypedBodyAsAListOfItsFields() {
        ReadResult inventory = inventory();

        Schema body = inventory.invoker().operation(OperationId.of("Get-All-Computers")).orElseThrow()
                .responseFor(200).orElseThrow().body().schema();

        assertThat(body).isInstanceOf(ArraySchema.class);
        assertThat(((ArraySchema) body).items()).isInstanceOf(ObjectSchema.class);
    }

    // ── pagination ───────────────────────────────────────

    @Test
    void readCopiesInvokerLevelPaginationToOperationsWithoutTheirOwn() {
        ReadResult inventory = inventory();

        Operation applications = inventory.invoker().operation(OperationId.of("GetApplications")).orElseThrow();

        assertThat(applications.pagination().rule(PageParam.OFFSET))
                .contains(PageRule.withValue(PageParam.OFFSET, PageAction.INCREMENT, "0"));
        assertThat(inventory.issues()).contains(InvokerIssue.info("/invoker/pagination", "the invoker-level "
                + "pagination was copied to the 1 operation(s) without their own, which is how 5.x applied it"));
    }

    @Test
    void readKeepsAnOperationsOwnPaginationAndSkipsUnusableRules() {
        ReadResult inventory = inventory();

        Operation computers = inventory.invoker().operation(OperationId.of("Get-All-Computers")).orElseThrow();

        assertThat(computers.pagination().rules()).extracting(PageRule::param)
                .containsExactly(PageParam.PAGE, PageParam.CURSOR, PageParam.SIZE);
        assertThat(inventory.issues()).filteredOn(issue -> issue.location().contains("/pagination/"))
                .extracting(InvokerIssue::message)
                .containsExactly("unknown pagination element <bogus> was skipped", "the rule has no action and was skipped");
    }

    // ── rejection ────────────────────────────────────────

    @Test
    void readRejectsTwoOperationsThatEndUpWithTheSameId() {
        byte[] file = v5With("", v5Operation("list items") + v5Operation("list-items"));

        InvokerReadException failure = catchThrowableOfType(InvokerReadException.class, () -> READER.read(file));

        assertThat(failure.issues()).contains(InvokerIssue.error(
                "/invoker/operations/operation[@name='list-items']", "another operation already has the id 'list-items'"));
    }

    @Test
    void readRejectsAnUnknownHttpMethod() {
        byte[] file = v5With("", """
                <operation name="a" type="">
                    <request><method>FETCH</method><endpoint>{url}</endpoint></request>
                    <response><success status="200"/></response>
                </operation>
                """);

        InvokerReadException failure = catchThrowableOfType(InvokerReadException.class, () -> READER.read(file));

        assertThat(failure.issues()).anySatisfy(issue -> {
            assertThat(issue.severity()).isEqualTo(InvokerIssue.Severity.ERROR);
            assertThat(issue.location()).isEqualTo("/invoker/operations/operation[@name='a']/request");
            assertThat(issue.message()).startsWith("unsupported HTTP method 'FETCH'");
        });
    }

    @Test
    void readRejectsAnInvokerWithoutOperations() {
        InvokerReadException failure = catchThrowableOfType(InvokerReadException.class, () -> READER.read(v5With("", "")));

        assertThat(failure.issues()).contains(InvokerIssue.error("/invoker", "the invoker declares no operations"));
    }
}
