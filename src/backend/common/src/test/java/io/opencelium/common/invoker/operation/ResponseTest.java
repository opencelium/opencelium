package io.opencelium.common.invoker.operation;

import io.opencelium.common.http.ContentType;
import io.opencelium.common.http.Header;
import io.opencelium.common.invoker.schema.Schema;
import org.junit.jupiter.api.Test;

import java.util.List;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;

class ResponseTest {

    // ── constructor ───────────────────────────────────────

    @Test
    void responseThrowsWhenContentTypeHeaderIsDeclared() {
        List<Header> headers = List.of(Header.of("Content-Type", "application/json"));

        assertThatThrownBy(() -> new Response(ResponseStatus.of(200), null, headers, null))
                .isInstanceOf(IllegalArgumentException.class)
                .hasMessage("response 200 declares a Content-Type header; "
                        + "state the media type as the body's contentType instead");
    }

    // ── header ────────────────────────────────────────────

    @Test
    void headerFindsHeaderIgnoringCase() {
        Response created = new Response(ResponseStatus.of(201), null, List.of(Header.of("Location", null)),
                Body.of(ContentType.APPLICATION_JSON, Schema.object()));

        assertThat(created.header("location")).isPresent();
    }

    // ── factories and builder ─────────────────────────────

    @Test
    void ofWithOnlyAStatusDescribesAResponseWithoutBody() {
        Response noContent = Response.of(ResponseStatus.of(204));

        assertThat(noContent.body()).isNull();
        assertThat(noContent.headers()).isEmpty();
    }

    @Test
    void builderTurnsAnExpressionIntoASuccessCondition() {
        Response response = Response.builder(ResponseStatus.of(200)).successWhen("body.error == null").build();

        assertThat(response.condition()).isEqualTo(SuccessCondition.of("body.error == null"));
    }
}
