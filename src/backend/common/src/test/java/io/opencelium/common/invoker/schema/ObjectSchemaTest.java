package io.opencelium.common.invoker.schema;

import org.junit.jupiter.api.Test;

import java.util.List;
import java.util.Map;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;

class ObjectSchemaTest {

    private final ObjectSchema ticket = Schema.object(
            Field.of("subject", Schema.string()),
            Field.of("assignee", Schema.object(Field.of("id", Schema.integer()))));

    // ── constructor ───────────────────────────────────────

    @Test
    void constructorThrowsWhenFieldIsDeclaredTwice() {
        assertThatThrownBy(() -> Schema.object(Field.of("id", Schema.string()), Field.of("id", Schema.integer())))
                .isInstanceOf(IllegalArgumentException.class)
                .hasMessage("field 'id' is declared more than once");
    }

    @Test
    void constructorThrowsWhenAttributeIsDeclaredTwice() {
        List<XmlAttribute> attributes = List.of(
                XmlAttribute.of("id", Schema.string()), XmlAttribute.of("id", Schema.integer()));

        assertThatThrownBy(() -> new ObjectSchema(List.of(), attributes))
                .isInstanceOf(IllegalArgumentException.class)
                .hasMessage("attribute 'id' is declared more than once");
    }

    // ── field ─────────────────────────────────────────────

    @Test
    void fieldReturnsFieldWhenNameMatchesExactly() {
        assertThat(ticket.field("subject")).map(Field::schema).contains(Schema.string());
    }

    @Test
    void fieldReturnsEmptyWhenNameDiffersOnlyInCase() {
        assertThat(ticket.field("Subject")).isEmpty();
    }

    // ── accepts ───────────────────────────────────────────

    @Test
    void acceptsReturnsTrueWhenValueSetsOnlySomeFields() {
        assertThat(ticket.accepts(Value.object(Map.entry("subject", Value.text("Printer broken"))))).isTrue();
    }

    @Test
    void acceptsReturnsFalseWhenValueHasUndeclaredField() {
        assertThat(ticket.accepts(Value.object(Map.entry("priority", Value.text("1"))))).isFalse();
    }

    @Test
    void acceptsReturnsFalseWhenNestedValueHasWrongShape() {
        assertThat(ticket.accepts(Value.object(Map.entry("assignee", Value.text("alice"))))).isFalse();
    }

    @Test
    void acceptsReturnsFalseWhenValueIsNotAnObject() {
        assertThat(ticket.accepts(Value.text("x"))).isFalse();
    }
}
