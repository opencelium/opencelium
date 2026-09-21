package io.opencelium.common.invoker.schema;

import java.util.Objects;

/**
 * A value whose shape is not known.
 *
 * <p>Use it when an API documents that a value exists but not what it holds, for example a list of
 * custom fields that differs per installation:
 * <pre>{@code
 * <field name="customFields" type="array">
 *     <items type="undefined"/>
 * </field>
 * }</pre>
 *
 * <p>Saying so explicitly is better than guessing {@code string}: consumers know not to offer
 * sub-fields, and nothing pretends the shape is settled.
 */
public record UndefinedSchema() implements Schema {

    /** The only value needed; all instances are equal. */
    public static final UndefinedSchema INSTANCE = new UndefinedSchema();

    @Override
    public String typeName() {
        return "undefined";
    }

    @Override
    public boolean accepts(Value value) {
        Objects.requireNonNull(value, "value must not be null");
        return true;
    }
}
