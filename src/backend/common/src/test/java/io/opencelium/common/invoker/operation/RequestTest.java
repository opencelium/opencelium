package io.opencelium.common.invoker.operation;

import io.opencelium.common.http.Header;
import io.opencelium.common.http.HttpMethod;
import io.opencelium.common.invoker.schema.Schema;
import org.junit.jupiter.api.Test;

import java.util.List;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;

class RequestTest {

    // ── constructor ───────────────────────────────────────

    @Test
    void constructorThrowsWhenEndpointContainsQueryString() {
        assertThatThrownBy(() -> Request.of(HttpMethod.GET, "{url}/items?include=CurrentVersion"))
                .isInstanceOf(IllegalArgumentException.class)
                .hasMessage("request endpoint '{url}/items?include=CurrentVersion' contains a query string; "
                        + "declare 'include=CurrentVersion' as parameters instead");
    }

    @Test
    void constructorThrowsWhenContentTypeHeaderIsDeclaredInAnyCase() {
        List<Header> headers = List.of(Header.of("content-type", "application/json"));

        assertThatThrownBy(() -> new Request(HttpMethod.POST, "{url}", headers, List.of(), null))
                .isInstanceOf(IllegalArgumentException.class)
                .hasMessage("request declares a Content-Type header; "
                        + "state the media type as the body's contentType instead");
    }

    @Test
    void constructorThrowsWhenParameterIsDeclaredTwice() {
        List<QueryParameter> parameters = List.of(
                QueryParameter.of("limit", Schema.integer()), QueryParameter.of("limit", Schema.string()));

        assertThatThrownBy(() -> new Request(HttpMethod.GET, "{url}", List.of(), parameters, null))
                .isInstanceOf(IllegalArgumentException.class)
                .hasMessage("query parameter 'limit' is declared more than once");
    }

    @Test
    void constructorAcceptsRepeatedHeaderWhenHttpAllowsIt() {
        List<Header> headers = List.of(Header.of("Accept", "application/json"), Header.of("Accept", "text/plain"));

        Request request = new Request(HttpMethod.GET, "{url}", headers, List.of(), null);

        assertThat(request.headers()).hasSize(2);
    }

    // ── header ────────────────────────────────────────────

    @Test
    void headerFindsHeaderIgnoringCase() {
        Request request = new Request(HttpMethod.GET, "{url}",
                List.of(Header.of("Authorization", "Bearer {token}")), List.of(), null);

        assertThat(request.header("authorization")).map(Header::value).contains("Bearer {token}");
    }

    // ── builder ───────────────────────────────────────────

    @Test
    void builderKeepsHeadersAndParametersInTheOrderTheyWereAdded() {
        Request request = Request.builder(HttpMethod.GET, "{url}/tickets")
                .header("Authorization", "Bearer {token}")
                .header("Accept", "application/json")
                .parameter(QueryParameter.of("limit", Schema.integer()))
                .parameter(QueryParameter.of("sort", Schema.string()))
                .build();

        assertThat(request.headers()).extracting(Header::name).containsExactly("Authorization", "Accept");
        assertThat(request.parameters()).extracting(QueryParameter::name).containsExactly("limit", "sort");
        assertThat(request.body()).isNull();
    }
}
