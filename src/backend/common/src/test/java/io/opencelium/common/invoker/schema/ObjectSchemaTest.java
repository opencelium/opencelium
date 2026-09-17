package io.opencelium.common.invoker.schema;

import org.junit.jupiter.api.Test;

import java.util.ArrayList;
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
        ObjectSchema schema = Schema.object();

        assertThatThrownBy(() -> schema.withAttributes(
                XmlAttribute.of("id", Schema.string()), XmlAttribute.of("id", Schema.string())))
                .isInstanceOf(IllegalArgumentException.class)
                .hasMessage("attribute 'id' is declared more than once");
    }

    @Test
    void constructorCopiesFieldsSoLaterChangesToTheInputDoNotLeakIn() {
        List<Field> input = new ArrayList<>(List.of(Field.of("a", Schema.string())));

        ObjectSchema schema = new ObjectSchema(input, List.of());
        input.add(Field.of("b", Schema.string()));

        assertThat(schema.fields()).extracting(Field::name).containsExactly("a");
    }

    @Test
    void fieldsKeepDeclarationOrder() {
        ObjectSchema schema = Schema.object(
                Field.of("z", Schema.string()), Field.of("a", Schema.string()), Field.of("m", Schema.string()));

        assertThat(schema.fields()).extracting(Field::name).containsExactly("z", "a", "m");
    }

    // ── field ─────────────────────────────────────────────

    @Test
    void fieldReturnsEmptyWhenNameDiffersOnlyInCase() {
        assertThat(ticket.field("Subject")).isEmpty();
        assertThat(ticket.field("subject")).isPresent();
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
        Value assigneeAsText = Value.object(Map.entry("assignee", Value.text("alice")));

        assertThat(ticket.accepts(assigneeAsText)).isFalse();
    }

    @Test
    void acceptsReturnsFalseWhenValueIsNotAnObject() {
        assertThat(ticket.accepts(Value.text("x"))).isFalse();
    }
}
