package io.opencelium.common.invoker.operation;

import io.opencelium.common.invoker.schema.Field;
import io.opencelium.common.invoker.schema.Schema;
import org.junit.jupiter.api.Test;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;

class QueryParameterTest {

    // ── of ────────────────────────────────────────────────

    @Test
    void ofUsesExplodedFormStyleByDefault() {
        QueryParameter limit = QueryParameter.of("limit", Schema.integer());

        assertThat(limit.style()).isEqualTo(QueryStyle.FORM);
        assertThat(limit.explode()).isTrue();
    }

    @Test
    void ofDoesNotExplodeWhenStyleIsNotForm() {
        QueryParameter ids = QueryParameter.of("ids", Schema.arrayOf(Schema.integer()), QueryStyle.PIPE_DELIMITED);

        assertThat(ids.explode()).isFalse();
    }

    // ── style and schema ──────────────────────────────────

    @Test
    void ofThrowsWhenScalarUsesAStyleOtherThanForm() {
        assertThatThrownBy(() -> QueryParameter.of("q", Schema.string(), QueryStyle.PIPE_DELIMITED))
                .isInstanceOf(IllegalArgumentException.class)
                .hasMessage("query parameter 'q' of type 'string' cannot use style 'pipeDelimited'; allowed: form");
    }

    @Test
    void ofThrowsWhenListUsesDeepObject() {
        assertThatThrownBy(() -> QueryParameter.of("ids", Schema.arrayOf(Schema.integer()), QueryStyle.DEEP_OBJECT))
                .isInstanceOf(IllegalArgumentException.class)
                .hasMessage("query parameter 'ids' of type 'array' cannot use style 'deepObject'; "
                        + "allowed: form, spaceDelimited, pipeDelimited");
    }

    @Test
    void ofThrowsWhenListHoldsObjects() {
        assertThatThrownBy(() -> QueryParameter.of("rows", Schema.arrayOf(Schema.object())))
                .isInstanceOf(IllegalArgumentException.class)
                .hasMessage("query parameter 'rows' is a list of 'object'; "
                        + "a query string can only carry a list of simple values");
    }

    @Test
    void ofAcceptsDeepObjectWhenSchemaIsAnObject() {
        QueryParameter filter = QueryParameter.of("filter",
                Schema.object(Field.of("owner", Schema.string())), QueryStyle.DEEP_OBJECT);

        assertThat(filter.style()).isEqualTo(QueryStyle.DEEP_OBJECT);
    }

    @Test
    void ofThrowsWhenTypeIsUndefined() {
        assertThatThrownBy(() -> QueryParameter.of("x", Schema.undefined()))
                .isInstanceOf(IllegalArgumentException.class)
                .hasMessage("query parameter 'x' has type 'undefined'; "
                        + "a value must have a known type to be written into a URL");
    }
}
