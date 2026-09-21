package io.opencelium.common.invoker.schema;

import java.util.Objects;

/**
 * A single value: a string, number, integer or boolean.
 *
 * <p>In an invoker file:
 * <pre>{@code
 * <field name="language" type="string">en</field>
 * <field name="apikey"   type="string">{apikey}</field>
 * <field name="id"       type="integer"/>
 * }</pre>
 *
 * <p>The default is kept as the text the author wrote. It may be a placeholder such as
 * {@code {apikey}}, so it is not parsed or checked against {@link #type()} here.
 *
 * @param type         what kind of value this is
 * @param defaultValue the value sent when nothing else is supplied, or {@code null} if there is none
 */
public record ScalarSchema(ScalarType type, String defaultValue) implements Schema {

    public ScalarSchema {
        Objects.requireNonNull(type, "scalar type must not be null");
    }

    @Override
    public String typeName() {
        return type.value();
    }

    @Override
    public boolean accepts(Value value) {
        return value instanceof Value.TextValue;
    }
}
