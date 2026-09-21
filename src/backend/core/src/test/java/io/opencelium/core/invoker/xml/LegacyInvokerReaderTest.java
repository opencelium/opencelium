package io.opencelium.core.invoker.xml;

import io.opencelium.core.invoker.InvokerFormat;
import io.opencelium.core.invoker.InvokerIssue;
import io.opencelium.core.invoker.InvokerReadException;
import io.opencelium.core.invoker.ReadResult;
import io.opencelium.common.http.ContentType;
import io.opencelium.common.invoker.Invoker;
import io.opencelium.common.invoker.operation.Body;
import io.opencelium.common.invoker.operation.Operation;
import io.opencelium.common.invoker.operation.OperationRole;
import io.opencelium.common.invoker.operation.QueryParameter;
import io.opencelium.common.invoker.operation.Request;
import io.opencelium.common.invoker.operation.Response;
import io.opencelium.common.invoker.operation.ResponseStatus;
import io.opencelium.common.invoker.pagination.PageAction;
import io.opencelium.common.invoker.pagination.PageParam;
import io.opencelium.common.invoker.pagination.PageRule;
import io.opencelium.common.invoker.schema.ArraySchema;
import io.opencelium.common.invoker.schema.Field;
import io.opencelium.common.invoker.schema.ObjectSchema;
import io.opencelium.common.invoker.schema.ScalarType;
import io.opencelium.common.invoker.schema.Schema;
import io.opencelium.common.invoker.schema.UndefinedSchema;
import io.opencelium.common.invoker.schema.Value;
import io.opencelium.common.invoker.setting.ConnectorSetting;
import org.junit.jupiter.api.Test;

import java.util.List;

import static io.opencelium.core.testutil.fixture.InvokerFiles.V5_CMDB_JSONRPC;
import static io.opencelium.core.testutil.fixture.InvokerFiles.V5_GRAPHQL_BASIC;
import static io.opencelium.core.testutil.fixture.InvokerFiles.V5_INVENTORY_PAGED;
import static io.opencelium.core.testutil.fixture.InvokerFiles.bytes;
import static io.opencelium.core.testutil.fixture.InvokerFiles.v5Operation;
import static io.opencelium.core.testutil.fixture.InvokerFiles.v5With;
import static io.opencelium.core.testutil.fixture.InvokerFiles.xml;
import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.catchThrowableOfType;
import static org.assertj.core.api.Assertions.tuple;

class LegacyInvokerReaderTest {

    private static final LegacyInvokerReader READER = new LegacyInvokerReader();

    private static ReadResult read(byte[] xml) {
        return READER.read(SecureXml.parse(xml));
    }

    private static InvokerReadException failure(byte[] xml) {
        return catchThrowableOfType(InvokerReadException.class, () -> read(xml));
    }

    // Parsed per test rather than in fields, so a regression in one fixture fails only the tests using it.
    private static ReadResult cmdb() {
        return read(bytes(V5_CMDB_JSONRPC));
    }

    private static ReadResult inventory() {
        return read(bytes(V5_INVENTORY_PAGED));
    }

    private static ReadResult graphql() {
        return read(bytes(V5_GRAPHQL_BASIC));
    }

    private static ConnectorSetting setting(Invoker invoker, String name) {
        return invoker.settings().stream().filter(setting -> setting.name().equals(name)).findFirst().orElseThrow();
    }

    private static Response response(Operation operation, int status) {
        return operation.responses().stream()
                .filter(response -> response.status().matches(status)).findFirst().orElseThrow();
    }

    // ── identity ─────────────────────────────────────────

    @Test
    void readDerivesTheInvokerIdFromTheNameAndReportsIt() {
        ReadResult cmdb = cmdb();

        assertThat(cmdb.format()).isEqualTo(InvokerFormat.LEGACY_V5);
        assertThat(cmdb.invoker().id()).isEqualTo("demo-cmdb");
        assertThat(cmdb.issues()).contains(InvokerIssue.info("/invoker/name", "derived the invoker id 'demo-cmdb' "
                + "from the name 'Demo CMDB'; connectors refer to the invoker by this id, which must not change"));
    }

    @Test
    void readStripsAccentsWhenDerivingTheInvokerId() {
        assertThat(inventory().invoker().id()).isEqualTo("demo-inventory");
    }

    @Test
    void readKeepsCategoryTags() {
        assertThat(cmdb().invoker().categoryTags()).containsExactlyInAnyOrder("CMDB", "Asset Management");
    }

    @Test
    void readKeepsDottedOperationNamesAsIdsAndReplacesInvalidCharacters() {
        assertThat(cmdb().invoker().operation("cmdb.objects.read")).isPresent();
        assertThat(inventory().invoker().operation("Get-All-Computers"))
                .map(Operation::name).contains("Get All Computers");
    }

    // ── settings ─────────────────────────────────────────

    @Test
    void readTreatsTextTypedSettingsAsStrings() {
        assertThat(setting(cmdb().invoker(), "username").type()).isEqualTo(ScalarType.STRING);
    }

    @Test
    void readKeepsAPublicSettingValueAsItsDefault() {
        assertThat(setting(cmdb().invoker(), "url")).isEqualTo(new ConnectorSetting(
                "url", ScalarType.STRING, "public", "http://{HOST}/jsonrpc.php", null));
    }

    @Test
    void readKeepsAPrivateReferenceAsItsSourceExactlyAsWritten() {
        assertThat(setting(cmdb().invoker(), "sessionid")).isEqualTo(new ConnectorSetting(
                "sessionid", ScalarType.STRING, "private", null, "%{login.body.result.session-id}"));
    }

    @Test
    void readKeepsBasicCredentialsAsWrittenIncludingTheBasicPrefix() {
        assertThat(setting(graphql().invoker(), "token").source()).isEqualTo("Basic {username:password}");
    }

    @Test
    void readUpdatesAReferenceToAnOperationWhoseNameHadToBecomeAnId() {
        byte[] file = v5With(
                "<item name=\"token\" type=\"string\" visibility=\"private\">Bearer %{Get Token.body.token}</item>",
                v5Operation("Get Token"));

        ReadResult result = read(file);

        assertThat(setting(result.invoker(), "token").source()).isEqualTo("Bearer %{Get-Token.body.token}");
        assertThat(result.issues()).contains(InvokerIssue.info("/invoker/requiredData/item[@name='token']",
                "updated the reference to the operation 'Get Token', which was given the id 'Get-Token'"));
    }

    @Test
    void readRejectsAPrivateSettingWithNothingToDeriveItFrom() {
        byte[] file = v5With("<item name=\"token\" type=\"string\" visibility=\"private\"/>", v5Operation("list"));

        assertThat(failure(file).issues()).contains(InvokerIssue.error("/invoker/requiredData/item[@name='token']",
                "the private setting 'token' has no value to derive it from"));
    }

    @Test
    void readWarnsAndTreatsASettingWithoutVisibilityAsPublic() {
        byte[] file = v5With("<item name=\"host\">example.com</item>", v5Operation("list"));

        ReadResult result = read(file);

        assertThat(setting(result.invoker(), "host").visibility()).isEqualTo("public");
        assertThat(result.issues()).contains(InvokerIssue.warning("/invoker/requiredData/item[@name='host']",
                "the setting has no visibility; treated as public"));
    }

    // ── requests ─────────────────────────────────────────

    @Test
    void readMovesTheContentTypeHeaderOntoTheBody() {
        Operation login = cmdb().invoker().operation("login").orElseThrow();

        assertThat(login.request().headers()).noneMatch(header -> header.hasName("Content-Type"));
        assertThat(login.request().body().contentType()).isEqualTo(ContentType.APPLICATION_JSON);
        assertThat(login.hasRole(OperationRole.TEST)).isTrue();
    }

    @Test
    void readLiftsTheQueryStringOutOfTheEndpoint() {
        Operation read = cmdb().invoker().operation("cmdb.objects.read").orElseThrow();

        assertThat(read.request().endpoint()).isEqualTo("{url}/objects");
        assertThat(read.request().parameters()).extracting(QueryParameter::name).containsExactly("include", "limit");
    }

    @Test
    void readMergesARepeatedQueryParameterIntoOneListParameter() {
        byte[] file = v5With("", """
                <operation name="disks" type="">
                    <request><method>GET</method>
                        <endpoint>{url}/disks?filter=isdeleted,is,NULL&amp;limit=10&amp;filter=workstationoid,eq,</endpoint>
                    </request>
                    <response><success status="200"/></response>
                </operation>
                """);

        ReadResult result = read(file);

        Request request = result.invoker().operation("disks").orElseThrow().request();
        assertThat(request.parameters()).extracting(QueryParameter::name).containsExactly("filter", "limit");
        assertThat(request.parameters().getFirst()).isEqualTo(QueryParameter.of("filter", new ArraySchema(
                Schema.string(), List.of(Value.text("isdeleted,is,NULL"), Value.text("workstationoid,eq,")))));
        assertThat(result.issues()).contains(InvokerIssue.warning("/invoker/operations/operation[@name='disks']/request",
                "the query parameter 'filter' is given 2 times; it became one list parameter holding every value"));
    }

    @Test
    void readKeepsTheGraphqlEnvelopeOnRequestsOnly() {
        Operation query = graphql().invoker().operation("Query").orElseThrow();

        assertThat(query.request().body().envelope()).isEqualTo("graphql");
        assertThat(response(query, 200).body().envelope()).isNull();
    }

    @Test
    void readTurnsOcAttributesIntoXmlAttributesAndWarnsAboutElementText() {
        ReadResult graphql = graphql();

        Body body = graphql.invoker().operation("Ticket").orElseThrow().request().body();
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

        Operation login = cmdb.invoker().operation("login").orElseThrow();

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
        Response login = cmdb().invoker().operation("login").orElseThrow().responses().getFirst();

        assertThat(((ObjectSchema) login.body().schema()).field("jsonrpc").orElseThrow().schema())
                .isEqualTo(Schema.string());
    }

    @Test
    void readKeepsDistinctStatusesAsSeparateResponses() {
        Operation read = cmdb().invoker().operation("cmdb.objects.read").orElseThrow();

        assertThat(read.responses()).extracting(response -> response.status().value()).containsExactly("200", "404");
    }

    @Test
    void readAddsADefaultResponseWhenTheOperationDescribesNone() {
        byte[] file = v5With("", """
                <operation name="ping" type="">
                    <request><method>GET</method><endpoint>{url}/ping</endpoint></request>
                </operation>
                """);

        ReadResult result = read(file);

        assertThat(result.invoker().operation("ping").orElseThrow().responses())
                .containsExactly(Response.of(ResponseStatus.DEFAULT));
        assertThat(result.issues()).contains(InvokerIssue.warning("/invoker/operations/operation[@name='ping']",
                "the operation describes no response; added a default response without a body"));
    }

    @Test
    void readDescribesArraysByShapeWhatever5xSpellingWasUsed() {
        Operation read = cmdb().invoker().operation("cmdb.objects.read").orElseThrow();
        ObjectSchema body = (ObjectSchema) response(read, 200).body().schema();

        assertThat(((ArraySchema) body.field("result").orElseThrow().schema()).items())
                .isInstanceOf(ObjectSchema.class);
        assertThat(((ArraySchema) body.field("ids").orElseThrow().schema()).items())
                .isEqualTo(UndefinedSchema.INSTANCE);
        assertThat(body.field("tags").orElseThrow().schema()).isEqualTo(Schema.arrayOf(Schema.string()));
    }

    @Test
    void readTreatsAnArrayTypedBodyAsAListOfItsFields() {
        Operation computers = inventory().invoker().operation("Get-All-Computers").orElseThrow();

        Schema body = response(computers, 200).body().schema();

        assertThat(body).isInstanceOf(ArraySchema.class);
        assertThat(((ArraySchema) body).items()).isInstanceOf(ObjectSchema.class);
    }

    // ── pagination ───────────────────────────────────────

    @Test
    void readCopiesInvokerLevelPaginationToOperationsWithoutTheirOwn() {
        ReadResult inventory = inventory();

        Operation applications = inventory.invoker().operation("GetApplications").orElseThrow();

        assertThat(applications.pagination().rules())
                .contains(new PageRule(PageParam.OFFSET, PageAction.INCREMENT, "0", null));
        assertThat(inventory.issues()).contains(InvokerIssue.info("/invoker/pagination", "the invoker-level "
                + "pagination was copied to the 1 operation(s) without their own, which is how 5.x applied it"));
    }

    @Test
    void readKeepsAnOperationsOwnPaginationAndSkipsUnusableRules() {
        ReadResult inventory = inventory();

        Operation computers = inventory.invoker().operation("Get-All-Computers").orElseThrow();

        assertThat(computers.pagination().rules()).extracting(PageRule::param)
                .containsExactly(PageParam.PAGE, PageParam.CURSOR, PageParam.SIZE);
        assertThat(inventory.issues()).filteredOn(issue -> issue.location().contains("/pagination/"))
                .extracting(InvokerIssue::message)
                .containsExactly("unknown pagination element <bogus> was skipped", "the rule has no action and was skipped");
    }

    @Test
    void readUsesJsonWhenABodyStatesNoMediaType() {
        byte[] file = v5With("", """
                <operation name="create" type="">
                    <request>
                        <method>POST</method><endpoint>{url}</endpoint>
                        <body data="raw" type="object"><field name="a" type="string"/></body>
                    </request>
                    <response><success status="201"/></response>
                </operation>
                """);

        ReadResult result = read(file);

        assertThat(result.invoker().operation("create").orElseThrow().request().body().contentType())
                .isEqualTo(ContentType.APPLICATION_JSON);
        assertThat(result.issues()).noneMatch(issue -> issue.message().contains("media type"));
    }

    // ── repeated names ───────────────────────────────────

    @Test
    void readKeepsTheFirstOfSameNamedOperationsAndSuffixesTheRestWithTheirMethod() {
        byte[] file = v5With("", """
                <operation name="article" type="">
                    <request><method>GET</method><endpoint>{url}/article</endpoint></request>
                    <response><success status="200"/></response>
                </operation>
                <operation name="article" type="">
                    <request><method>POST</method><endpoint>{url}/article</endpoint></request>
                    <response><success status="201"/></response>
                </operation>
                <operation name="article" type="">
                    <request><method>POST</method><endpoint>{url}/article/bulk</endpoint></request>
                    <response><success status="201"/></response>
                </operation>
                """);

        ReadResult result = read(file);

        assertThat(result.invoker().operations()).extracting(Operation::id, Operation::name).containsExactly(
                tuple("article", "article"), tuple("article-post", "article"), tuple("article-post-2", "article"));
        assertThat(result.issues()).contains(InvokerIssue.warning("/invoker/operations/operation[@name='article']",
                "another operation is also named 'article'; 5.x could only run the first of them, "
                        + "so this one was given the id 'article-post'"));
    }

    @Test
    void readKeepsTheLastOfRepeatedFieldsAtThePositionOfTheFirst() {
        byte[] file = v5With("", """
                <operation name="disk" type="">
                    <request>
                        <method>POST</method><endpoint>{url}</endpoint>
                        <body data="raw" format="json" type="object">
                            <field name="Capacity" type="string"/>
                            <field name="Model" type="string"/>
                            <field name="Capacity" type="integer"/>
                        </body>
                    </request>
                    <response><success status="201"/></response>
                </operation>
                """);

        ReadResult result = read(file);

        ObjectSchema body = (ObjectSchema) result.invoker().operation("disk").orElseThrow().request().body().schema();
        assertThat(body.fields()).containsExactly(
                Field.of("Capacity", Schema.integer()), Field.of("Model", Schema.string()));
        assertThat(result.issues()).anySatisfy(issue -> assertThat(issue.message())
                .isEqualTo("the field 'Capacity' is declared more than once; kept the last declaration, as 5.x did"));
    }

    // ── rejection ────────────────────────────────────────

    @Test
    void readRejectsTwoOperationsThatEndUpWithTheSameId() {
        byte[] file = v5With("", v5Operation("list items") + v5Operation("list-items"));

        assertThat(failure(file).issues()).contains(InvokerIssue.error(
                "/invoker/operations/operation[@name='list-items']", "another operation already has the id 'list-items'"));
    }

    @Test
    void readRejectsAnInvokerWithoutOperations() {
        InvokerReadException failure = failure(v5With("", ""));

        assertThat(failure.format()).contains(InvokerFormat.LEGACY_V5);
        assertThat(failure.issues()).contains(InvokerIssue.error("/invoker", "the invoker declares no operations"));
    }

    @Test
    void readRejectsAnInvokerWithoutAName() {
        byte[] file = xml("<invoker><operations>" + v5Operation("list") + "</operations></invoker>");

        assertThat(failure(file).issues()).contains(InvokerIssue.error("/invoker", "the invoker has no <name>"));
    }
}
