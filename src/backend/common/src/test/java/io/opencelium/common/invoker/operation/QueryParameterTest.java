package io.opencelium.common.invoker.operation;

import io.opencelium.common.invoker.schema.Field;
import io.opencelium.common.invoker.schema.Schema;
import org.junit.jupiter.api.Test;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;

class QueryParameterTest {

    // ── defaults ──────────────────────────────────────────

    @Test
    void ofUsesFormStyleAndExplodesByDefault() {
        QueryParameter limit = QueryParameter.of("limit", Schema.integer());

        assertThat(limit.style()).isEqualTo(QueryStyle.FORM);
        assertThat(limit.explode()).isTrue();
    }

    @Test
    void ofWithStyleDoesNotExplodeWhenStyleIsNotForm() {
        QueryParameter ids = QueryParameter.of("ids", Schema.arrayOf(Schema.integer()), QueryStyle.PIPE_DELIMITED);

        assertThat(ids.explode()).isFalse();
    }

    // ── style compatibility ───────────────────────────────

    @Test
    void constructorThrowsWhenSingleValueUsesADelimitedStyle() {
        assertThatThrownBy(() -> QueryParameter.of("sort", Schema.string(), QueryStyle.SPACE_DELIMITED))
                .isInstanceOf(IllegalArgumentException.class)
                .hasMessage("query parameter 'sort' of type 'string' cannot use style 'spaceDelimited'; allowed: form");
    }

    @Test
    void constructorThrowsWhenListUsesDeepObject() {
        assertThatThrownBy(() -> QueryParameter.of("ids", Schema.arrayOf(Schema.integer()), QueryStyle.DEEP_OBJECT))
                .isInstanceOf(IllegalArgumentException.class)
                .hasMessage("query parameter 'ids' of type 'array' cannot use style 'deepObject'; "
                        + "allowed: form, spaceDelimited, pipeDelimited");
    }

    @Test
    void constructorAcceptsDeepObjectWhenValueIsAnObject() {
        QueryParameter filter = QueryParameter.of("filter",
                Schema.object(Field.of("status", Schema.string())), QueryStyle.DEEP_OBJECT);

        assertThat(filter.style()).isEqualTo(QueryStyle.DEEP_OBJECT);
    }

    @Test
    void constructorThrowsWhenListHoldsObjects() {
        assertThatThrownBy(() -> QueryParameter.of("tickets", Schema.arrayOf(Schema.object())))
                .isInstanceOf(IllegalArgumentException.class)
                .hasMessage("query parameter 'tickets' is a list of 'object'; "
                        + "a query string can only carry a list of simple values");
    }

    @Test
    void constructorThrowsWhenTypeIsUndefined() {
        assertThatThrownBy(() -> QueryParameter.of("anything", Schema.undefined()))
                .isInstanceOf(IllegalArgumentException.class)
                .hasMessage("query parameter 'anything' has type 'undefined'; "
                        + "a value must have a known type to be written into a URL");
    }
}
