package io.opencelium.common.invoker.schema;

import org.junit.jupiter.api.Test;

import java.util.LinkedHashMap;
import java.util.Map;
import java.util.SequencedMap;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;

class ArraySchemaTest {

    // ── constructor ───────────────────────────────────────

    @Test
    void constructorThrowsWhenDefaultDoesNotMatchElementType() {
        ArraySchema labels = Schema.arrayOf(Schema.string());

        assertThatThrownBy(() -> labels.withDefaults(Value.text("ok"), Value.array(Value.text("nested"))))
                .isInstanceOf(IllegalArgumentException.class)
                .hasMessage("default value #2 does not match the array's element type 'string'");
    }

    @Test
    void constructorAcceptsObjectDefaultsWhenTheyMatchTheElementSchema() {
        ArraySchema watchers = Schema.arrayOf(Schema.object(
                Field.of("email", Schema.string()), Field.of("notify", Schema.bool())));

        ArraySchema withDefault = watchers.withDefaults(
                Value.object(Map.entry("email", Value.text("ops@acme.com"))));

        assertThat(withDefault.defaults()).hasSize(1);
    }

    @Test
    void constructorThrowsWhenObjectDefaultNamesAnUndeclaredField() {
        ArraySchema watchers = Schema.arrayOf(Schema.object(Field.of("email", Schema.string())));

        assertThatThrownBy(() -> watchers.withDefaults(Value.object(Map.entry("phone", Value.text("1")))))
                .isInstanceOf(IllegalArgumentException.class)
                .hasMessage("default value #1 does not match the array's element type 'object'");
    }

    // ── accepts ───────────────────────────────────────────

    @Test
    void acceptsReturnsTrueForNestedArraysWhenEveryElementMatches() {
        ArraySchema matrix = Schema.arrayOf(Schema.arrayOf(Schema.integer()));

        assertThat(matrix.accepts(Value.array(Value.array(Value.text("1"), Value.text("{n}"))))).isTrue();
        assertThat(matrix.accepts(Value.array(Value.text("1")))).isFalse();
    }

    @Test
    void undefinedElementsAcceptAnyValue() {
        ArraySchema custom = Schema.arrayOf(Schema.undefined());

        assertThat(custom.accepts(Value.array(Value.text("a"), Value.array(), Value.object()))).isTrue();
    }

    // ── Value ─────────────────────────────────────────────

    @Test
    void valueObjectThrowsWhenFieldIsGivenTwice() {
        assertThatThrownBy(() -> Value.object(Map.entry("a", Value.text("1")), Map.entry("a", Value.text("2"))))
                .isInstanceOf(IllegalArgumentException.class)
                .hasMessage("value field 'a' is given more than once");
    }

    @Test
    void objectValueKeepsOrderAndIgnoresLaterChangesToTheInput() {
        SequencedMap<String, Value> input = new LinkedHashMap<>();
        input.put("z", Value.text("1"));
        input.put("a", Value.text("2"));

        Value.ObjectValue value = new Value.ObjectValue(input);
        input.put("m", Value.text("3"));

        assertThat(value.fields().sequencedKeySet()).containsExactly("z", "a");
    }
}
