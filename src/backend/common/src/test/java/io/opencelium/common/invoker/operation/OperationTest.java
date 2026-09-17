package io.opencelium.common.invoker.operation;

import io.opencelium.common.http.HttpMethod;
import org.junit.jupiter.api.Test;

import java.util.List;
import java.util.Set;

import static io.opencelium.common.testutil.fixture.OperationFixture.aJsonResponse;
import static io.opencelium.common.testutil.fixture.OperationFixture.anOperation;
import static io.opencelium.common.testutil.fixture.OperationFixture.anOperationWithResponses;
import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;

class OperationTest {

    private final Response notFound = aJsonResponse(ResponseStatus.of(404));
    private final Response clientError = aJsonResponse(ResponseStatus.parse("4XX"));
    private final Response fallback = aJsonResponse(ResponseStatus.DEFAULT);

    // ── responseFor ───────────────────────────────────────

    @Test
    void responseForReturnsExactMatchWhenItsClassAndDefaultAlsoMatch() {
        Operation operation = anOperationWithResponses(fallback, clientError, notFound);

        assertThat(operation.responseFor(404)).contains(notFound);
    }

    @Test
    void responseForReturnsClassWhenNoExactCodeMatches() {
        Operation operation = anOperationWithResponses(fallback, clientError, notFound);

        assertThat(operation.responseFor(409)).contains(clientError);
    }

    @Test
    void responseForReturnsDefaultWhenNothingMoreSpecificMatches() {
        Operation operation = anOperationWithResponses(fallback, clientError, notFound);

        assertThat(operation.responseFor(503)).contains(fallback);
    }

    @Test
    void responseForReturnsEmptyWhenNothingMatchesAndThereIsNoDefault() {
        Operation operation = anOperationWithResponses(aJsonResponse(ResponseStatus.of(200)));

        assertThat(operation.responseFor(500)).isEmpty();
    }

    // ── constructor ───────────────────────────────────────

    @Test
    void constructorThrowsWhenStatusIsDeclaredTwice() {
        assertThatThrownBy(() -> anOperationWithResponses(clientError, aJsonResponse(ResponseStatus.parse("4xx"))))
                .isInstanceOf(IllegalArgumentException.class)
                .hasMessage("operation 'op' declares response '4XX' more than once");
    }

    @Test
    void constructorThrowsWhenThereAreNoResponses() {
        assertThatThrownBy(() -> anOperationWithResponses())
                .isInstanceOf(IllegalArgumentException.class)
                .hasMessage("operation 'op' must declare at least one response; use status 'default' to accept any");
    }

    @Test
    void constructorThrowsWhenNameIsBlank() {
        assertThatThrownBy(() -> new Operation(OperationId.of("op"), " ", null, Set.of(),
                Request.of(HttpMethod.GET, "{url}"), List.of(fallback), null))
                .isInstanceOf(IllegalArgumentException.class)
                .hasMessage("name of operation 'op' must not be blank");
    }

    // ── roles ─────────────────────────────────────────────

    @Test
    void hasRoleReturnsTrueOnlyForDeclaredRoles() {
        Operation login = anOperation("login", OperationRole.TEST, OperationRole.AUTH);

        assertThat(login.hasRole(OperationRole.AUTH)).isTrue();
        assertThat(anOperation("list").hasRole(OperationRole.AUTH)).isFalse();
    }

    @Test
    void operationRoleParseAllReturnsEmptyWhenAttributeIsBlank() {
        assertThat(OperationRole.parseAll("   ")).isEmpty();
    }

    @Test
    void operationRoleParseAllCountsRepeatedNameOnce() {
        assertThat(OperationRole.parseAll(" test  AUTH test ")).containsExactly(OperationRole.TEST, OperationRole.AUTH);
    }

    @Test
    void operationRoleParseAllThrowsWhenANameIsUnknown() {
        assertThatThrownBy(() -> OperationRole.parseAll("test page"))
                .isInstanceOf(IllegalArgumentException.class)
                .hasMessage("'page' is not an operation role; expected [test, auth]");
    }

    // ── OperationId ───────────────────────────────────────

    @Test
    void operationIdAcceptsDotsWhenApiNamesOperationsThatWay() {
        assertThat(OperationId.of("cmdb.objects.read")).hasToString("cmdb.objects.read");
    }

    @Test
    void operationIdThrowsWhenItContainsWhitespace() {
        assertThatThrownBy(() -> OperationId.of("list tickets"))
                .isInstanceOf(IllegalArgumentException.class)
                .hasMessage("'list tickets' is not a valid operation id; use letters, digits, '.', '_' and '-'");
    }

    // ── builder ───────────────────────────────────────────

    @Test
    void builderAcceptsRequestAndResponsesThatAreStillBeingBuilt() {
        Operation operation = Operation.builder("createTicket", "Create ticket")
                .summary("Opens a ticket")
                .role(OperationRole.TEST)
                .request(Request.builder(HttpMethod.POST, "{url}/tickets").header("Accept", "application/json"))
                .response(Response.builder(ResponseStatus.of(201)).header("Location"))
                .build();

        assertThat(operation.request().header("Accept")).isPresent();
        assertThat(operation.responseFor(201).orElseThrow().header("Location")).isPresent();
        assertThat(operation.hasRole(OperationRole.TEST)).isTrue();
    }

    @Test
    void builderThrowsWhenNoRequestWasSet() {
        Operation.Builder withoutRequest = Operation.builder("op", "op").response(Response.of(ResponseStatus.DEFAULT));

        assertThatThrownBy(withoutRequest::build)
                .isInstanceOf(NullPointerException.class)
                .hasMessage("request of operation 'op' must not be null");
    }
}
