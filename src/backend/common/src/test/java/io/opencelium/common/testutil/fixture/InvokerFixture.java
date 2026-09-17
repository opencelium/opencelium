package io.opencelium.common.testutil.fixture;

import io.opencelium.common.http.ContentType;
import io.opencelium.common.http.HttpMethod;
import io.opencelium.common.invoker.Invoker;
import io.opencelium.common.invoker.InvokerId;
import io.opencelium.common.invoker.operation.Body;
import io.opencelium.common.invoker.operation.BodyEnvelope;
import io.opencelium.common.invoker.operation.Operation;
import io.opencelium.common.invoker.operation.OperationRole;
import io.opencelium.common.invoker.operation.QueryParameter;
import io.opencelium.common.invoker.operation.QueryStyle;
import io.opencelium.common.invoker.operation.Request;
import io.opencelium.common.invoker.operation.Response;
import io.opencelium.common.invoker.operation.ResponseStatus;
import io.opencelium.common.invoker.operation.XmlNamespace;
import io.opencelium.common.invoker.pagination.PageAction;
import io.opencelium.common.invoker.pagination.PageParam;
import io.opencelium.common.invoker.pagination.PageRule;
import io.opencelium.common.invoker.pagination.Pagination;
import io.opencelium.common.invoker.schema.Field;
import io.opencelium.common.invoker.schema.ScalarType;
import io.opencelium.common.invoker.schema.Schema;
import io.opencelium.common.invoker.schema.Value;
import io.opencelium.common.invoker.schema.XmlAttribute;
import io.opencelium.common.invoker.setting.ConnectorSetting;
import io.opencelium.common.invoker.setting.Visibility;

import java.util.List;
import java.util.Map;

import static io.opencelium.common.testutil.fixture.OperationFixture.aJsonResponse;

/** Invokers for tests. Operations come from {@link OperationFixture}. */
public final class InvokerFixture {

    private InvokerFixture() {
    }

    /** A minimal valid invoker holding the given settings and operations. */
    public static Invoker anInvoker(List<ConnectorSetting> settings, List<Operation> operations) {
        return Invoker.builder(InvokerId.of("test-invoker"), "Test invoker")
                .settings(settings)
                .operations(operations)
                .build();
    }

    /**
     * A service desk invoker using every construct of the model at once, so a test can confirm the
     * rules do not contradict each other on a realistic description.
     */
    public static Invoker aServiceDeskInvoker() {
        return Invoker.builder(InvokerId.of("example-service-desk"), "Example Service Desk")
                .description("Reference invoker using every construct.")
                .hint("Enter your instance URL.")
                .icon("service-desk.png")
                .authType("token")
                .categoryTag("Ticketing")
                .categoryTag("Service Desk")
                .setting(new ConnectorSetting("url", ScalarType.STRING, Visibility.PUBLIC, "https://acme.example.com", null))
                .setting(ConnectorSetting.ofPublic("username"))
                .setting(ConnectorSetting.ofProtected("password"))
                .setting(ConnectorSetting.ofProtected("apikey"))
                .setting(ConnectorSetting.ofPrivate("sessionToken", "%{login.body.result.session-id}"))
                .setting(ConnectorSetting.ofPrivate("basicAuth", "{username:password}"))
                .operation(login())
                .operation(listTickets())
                .operation(createTicket())
                .operation(updateTicket())
                .operation(downloadReport())
                .operation(deleteTicket())
                .operation(searchGraph())
                .operation(legacyLogin())
                .build();
    }

    private static Operation.Builder login() {
        return Operation.builder("login", "login")
                .summary("Exchange credentials for a session token")
                .role(OperationRole.TEST)
                .role(OperationRole.AUTH)
                .request(Request.builder(HttpMethod.POST, "{url}/session")
                        .header("X-Auth-User", "{username}")
                        .body(Body.of(ContentType.APPLICATION_JSON, Schema.object(
                                Field.of("apikey", Schema.string().withDefault("{apikey}"))))))
                .response(Response.builder(ResponseStatus.of(200))
                        .successWhen("body.error == null")
                        .body(Body.of(ContentType.APPLICATION_JSON, Schema.object(
                                Field.of("result", Schema.object(Field.of("session-id", Schema.string()))),
                                Field.of("error", Schema.object(Field.of("message", Schema.string())))))))
                .response(aJsonResponse(ResponseStatus.parse("4XX")))
                .response(Response.of(ResponseStatus.parse("5XX"), Body.of(ContentType.TEXT_PLAIN, Schema.string())));
    }

    private static Operation.Builder listTickets() {
        return Operation.builder("listTickets", "listTickets")
                .request(authorized(Request.builder(HttpMethod.GET, "{url}/tickets"))
                        .parameter(QueryParameter.of("limit", Schema.integer().withDefault("50")))
                        .parameter(new QueryParameter("status",
                                Schema.arrayOf(Schema.string()).withDefaults(Value.text("open"), Value.text("pending")),
                                QueryStyle.FORM, false)))
                .pagination(Pagination.of(
                        PageRule.withValue(PageParam.LIMIT, PageAction.WRITE, "50"),
                        PageRule.withValue(PageParam.OFFSET, PageAction.INCREMENT, "0"),
                        PageRule.withRef(PageParam.SIZE, PageAction.READ, "response.body.$.meta.total"),
                        PageRule.withRef(PageParam.RESULT, PageAction.COLLECT, "response.body.$.items")))
                .response(Response.of(ResponseStatus.of(200), Body.of(ContentType.APPLICATION_JSON, Schema.object(
                        Field.of("items", Schema.arrayOf(Schema.object(
                                Field.of("id", Schema.integer()),
                                Field.of("labels", Schema.arrayOf(Schema.string()))))),
                        Field.of("meta", Schema.object(Field.of("total", Schema.integer())))))))
                .response(aJsonResponse(ResponseStatus.DEFAULT));
    }

    private static Operation.Builder createTicket() {
        return Operation.builder("createTicket", "createTicket")
                .request(authorized(Request.builder(HttpMethod.POST, "{url}/tickets"))
                        .body(Body.of(ContentType.APPLICATION_JSON, Schema.object(
                                Field.of("subject", Schema.string()),
                                Field.of("requester", Schema.object(Field.of("email", Schema.string()))),
                                Field.of("watchers", Schema.arrayOf(Schema.object(
                                                Field.of("email", Schema.string()),
                                                Field.of("notify", Schema.bool())))
                                        .withDefaults(Value.object(
                                                Map.entry("email", Value.text("ops@acme.com")),
                                                Map.entry("notify", Value.text("true"))))),
                                Field.of("labels", Schema.arrayOf(Schema.string())
                                        .withDefaults(Value.text("inbound"), Value.text("unclassified")))))))
                .response(Response.builder(ResponseStatus.of(201))
                        .header("Location")
                        .body(Body.of(ContentType.APPLICATION_JSON, Schema.object(Field.of("id", Schema.integer())))))
                .response(aJsonResponse(ResponseStatus.parse("4XX")));
    }

    private static Operation.Builder updateTicket() {
        Body body = Body.builder(ContentType.APPLICATION_XML)
                .schema(Schema.object(Field.of("ticket", Schema.object(
                                Field.of("status", Schema.string().withDefault("resolved")))
                        .withAttributes(XmlAttribute.of("id", Schema.integer().withDefault("{ticketId}"))))))
                .xmlNamespace(XmlNamespace.of("http://example.com/servicedesk/v1", "sd"))
                .build();
        return Operation.builder("updateTicket", "updateTicket")
                .request(authorized(Request.builder(HttpMethod.PATCH, "{url}/tickets/{ticketId}")).body(body))
                .response(Response.of(ResponseStatus.of(200), body));
    }

    private static Operation.Builder downloadReport() {
        return Operation.builder("downloadReport", "downloadReport")
                .request(authorized(Request.builder(HttpMethod.GET, "{url}/reports/{reportId}")))
                .response(Response.of(ResponseStatus.of(200), Body.opaque(ContentType.parse("application/pdf"))));
    }

    private static Operation.Builder deleteTicket() {
        return Operation.builder("deleteTicket", "deleteTicket")
                .request(authorized(Request.builder(HttpMethod.DELETE, "{url}/tickets/{ticketId}")))
                .response(Response.of(ResponseStatus.of(204)))
                .response(aJsonResponse(ResponseStatus.DEFAULT));
    }

    private static Operation.Builder searchGraph() {
        return Operation.builder("cmdb.objects.search", "searchGraph")
                .request(authorized(Request.builder(HttpMethod.POST, "{url}/graphql"))
                        .body(Body.builder(ContentType.APPLICATION_JSON)
                                .envelope(BodyEnvelope.GRAPHQL)
                                .schema(Schema.object(
                                        Field.of("query", Schema.string()),
                                        Field.of("variables", Schema.object()),
                                        Field.of("operationName", Schema.string())))
                                .build()))
                .response(Response.builder(ResponseStatus.of(200))
                        .successWhen("body.errors == null")
                        .body(Body.of(ContentType.APPLICATION_JSON, Schema.object(
                                Field.of("data", Schema.undefined()),
                                Field.of("errors", Schema.arrayOf(Schema.object(Field.of("message", Schema.string()))))))));
    }

    private static Operation.Builder legacyLogin() {
        return Operation.builder("legacyLogin", "legacyLogin")
                .request(Request.builder(HttpMethod.POST, "{url}/legacy/login")
                        .header("Authorization", "{basicAuth}")
                        .body(Body.of(ContentType.APPLICATION_FORM_URLENCODED, Schema.object(
                                Field.of("grant_type", Schema.string().withDefault("password")),
                                Field.of("username", Schema.string().withDefault("{username}"))))))
                .response(Response.of(ResponseStatus.of(200)));
    }

    private static Request.Builder authorized(Request.Builder request) {
        return request.header("Authorization", "Bearer {sessionToken}");
    }
}
