package io.opencelium.common.invoker.schema;

import org.junit.jupiter.api.Test;

import java.util.List;
import java.util.Map;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;

class ArraySchemaTest {

    // ── constructor ───────────────────────────────────────

    @Test
    void constructorThrowsWhenDefaultDoesNotMatchElementType() {
        List<Value> defaults = List.of(Value.text("ok"), new Value.ArrayValue(List.of(Value.text("nested"))));

        assertThatThrownBy(() -> new ArraySchema(Schema.string(), defaults))
                .isInstanceOf(IllegalArgumentException.class)
                .hasMessage("default value #2 does not match the array's element type 'string'");
    }

    @Test
    void constructorAcceptsObjectDefaultWhenItMatchesTheElementSchema() {
        ObjectSchema watcher = Schema.object(Field.of("email", Schema.string()), Field.of("notify", Schema.bool()));

        ArraySchema watchers = new ArraySchema(watcher,
                List.of(Value.object(Map.entry("email", Value.text("ops@acme.com")))));

        assertThat(watchers.defaults()).hasSize(1);
    }

    // ── accepts ───────────────────────────────────────────

    @Test
    void acceptsReturnsTrueWhenEveryNestedElementMatches() {
        ArraySchema matrix = Schema.arrayOf(Schema.arrayOf(Schema.integer()));
        Value row = new Value.ArrayValue(List.of(Value.text("1"), Value.text("{n}")));

        assertThat(matrix.accepts(new Value.ArrayValue(List.of(row)))).isTrue();
        assertThat(matrix.accepts(new Value.ArrayValue(List.of(Value.text("1"))))).isFalse();
    }

    @Test
    void acceptsReturnsFalseWhenValueIsNotAList() {
        assertThat(Schema.arrayOf(Schema.string()).accepts(Value.text("a,b"))).isFalse();
    }

    @Test
    void acceptsReturnsTrueForAnyElementWhenItemsAreUndefined() {
        ArraySchema custom = Schema.arrayOf(Schema.undefined());
        Value mixed = new Value.ArrayValue(List.of(
                Value.text("a"), new Value.ArrayValue(List.of()), Value.object()));

        assertThat(custom.accepts(mixed)).isTrue();
    }
}
