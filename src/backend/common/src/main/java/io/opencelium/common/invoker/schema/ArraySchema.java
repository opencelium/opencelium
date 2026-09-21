package io.opencelium.common.invoker.schema;

import java.util.List;
import java.util.Objects;

/**
 * A list whose elements all share one shape.
 *
 * <p>In an invoker file the element schema and the defaults are <em>siblings</em>:
 * <pre>{@code
 * <field name="labels" type="array">
 *     <items type="string"/>        <!-- the shape of one element -->
 *     <value>inbound</value>        <!-- a default element -->
 *     <value>unclassified</value>
 * </field>
 * }</pre>
 *
 * <p>{@link #items()} describes one element, never several. A list of tickets has one ticket schema,
 * not one per ticket.
 *
 * @param items    the shape every element has
 * @param defaults elements sent when nothing else is supplied, in order; each one is checked against
 *                 {@code items} when the schema is built
 */
public record ArraySchema(Schema items, List<Value> defaults) implements Schema {

    public ArraySchema {
        Objects.requireNonNull(items, "array items must not be null");
        Objects.requireNonNull(defaults, "array defaults must not be null");
        defaults = List.copyOf(defaults);
        for (int i = 0; i < defaults.size(); i++) {
            if (!items.accepts(defaults.get(i))) {
                throw new IllegalArgumentException("default value #" + (i + 1)
                        + " does not match the array's element type '" + items.typeName() + "'");
            }
        }
    }

    @Override
    public String typeName() {
        return "array";
    }

    @Override
    public boolean accepts(Value value) {
        return value instanceof Value.ArrayValue(var elements) && elements.stream().allMatch(items::accepts);
    }
}
