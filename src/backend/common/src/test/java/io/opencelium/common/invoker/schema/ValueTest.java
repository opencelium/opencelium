package io.opencelium.common.invoker.schema;

import org.junit.jupiter.api.Test;

import java.util.LinkedHashMap;
import java.util.Map;
import java.util.SequencedMap;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;

class ValueTest {

    @Test
    void objectKeepsFieldsInTheOrderTheyWereGiven() {
        Value.ObjectValue value = Value.object(
                Map.entry("z", Value.text("1")), Map.entry("a", Value.text("2")), Map.entry("m", Value.text("3")));

        assertThat(value.fields().sequencedKeySet()).containsExactly("z", "a", "m");
    }

    @Test
    void objectThrowsWhenFieldIsGivenTwice() {
        assertThatThrownBy(() -> Value.object(Map.entry("a", Value.text("1")), Map.entry("a", Value.text("2"))))
                .isInstanceOf(IllegalArgumentException.class)
                .hasMessage("value field 'a' is given more than once");
    }

    @Test
    void objectValueIgnoresLaterChangesToTheInputMap() {
        SequencedMap<String, Value> input = new LinkedHashMap<>();
        input.put("a", Value.text("1"));

        Value.ObjectValue value = new Value.ObjectValue(input);
        input.put("b", Value.text("2"));

        assertThat(value.fields()).containsOnlyKeys("a");
    }
}
