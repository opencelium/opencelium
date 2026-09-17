package io.opencelium.common.invoker.schema;

import java.util.Collections;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;
import java.util.Objects;
import java.util.SequencedMap;

/**
 * A concrete default value, as opposed to a {@link Schema}, which only describes shape.
 *
 * <p>Values appear where an array lists its default elements:
 * <pre>{@code
 * <field name="watchers" type="array">
 *     <items type="object">
 *         <field name="email" type="string"/>
 *     </items>
 *     <value>                                   <!-- an ObjectValue -->
 *         <field name="email">ops@acme.com</field>  <!-- a TextValue  -->
 *     </value>
 * </field>
 * }</pre>
 *
 * <p>Text is kept as written and never converted to a number or boolean, because it may be a
 * placeholder that is only filled in at execution time.
 */
public sealed interface Value permits Value.TextValue, Value.ObjectValue, Value.ArrayValue {

    static TextValue text(String text) {
        return new TextValue(text);
    }

    static ArrayValue array(Value... elements) {
        return new ArrayValue(List.of(elements));
    }

    @SafeVarargs
    static ObjectValue object(Map.Entry<String, ? extends Value>... fields) {
        SequencedMap<String, Value> ordered = new LinkedHashMap<>();
        for (Map.Entry<String, ? extends Value> field : fields) {
            if (ordered.putIfAbsent(field.getKey(), field.getValue()) != null) {
                throw new IllegalArgumentException("value field '" + field.getKey() + "' is given more than once");
            }
        }
        return new ObjectValue(ordered);
    }

    /** A single piece of text. */
    record TextValue(String text) implements Value {

        public TextValue {
            Objects.requireNonNull(text, "text value must not be null");
        }
    }

    /** Named values, in the order they were written. */
    record ObjectValue(SequencedMap<String, Value> fields) implements Value {

        public ObjectValue {
            Objects.requireNonNull(fields, "value fields must not be null");
            SequencedMap<String, Value> copy = new LinkedHashMap<>();
            fields.forEach((name, value) -> {
                Objects.requireNonNull(name, "value field name must not be null");
                Objects.requireNonNull(value, "value of field '" + name + "' must not be null");
                if (name.isBlank()) {
                    throw new IllegalArgumentException("value field name must not be blank");
                }
                copy.put(name, value);
            });
            fields = Collections.unmodifiableSequencedMap(copy);
        }
    }

    /** An ordered list of values. */
    record ArrayValue(List<Value> elements) implements Value {

        public ArrayValue {
            Objects.requireNonNull(elements, "array elements must not be null");
            elements = List.copyOf(elements);
        }
    }
}
