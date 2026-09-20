package io.opencelium.common.invoker.schema;

import java.util.List;

/**
 * The shape of a value. Exactly one of {@link ObjectSchema}, {@link ArraySchema},
 * {@link ScalarSchema} or {@link UndefinedSchema}.
 */
public sealed interface Schema permits ObjectSchema, ArraySchema, ScalarSchema, UndefinedSchema {

    String typeName();

    /**
     * Whether a value has a shape this schema accepts.
     *
     * <p>This checks structure only. Scalar text is not parsed, because a default such as
     * {@code {limit}} is a placeholder that only becomes a number at execution time.
     */
    boolean accepts(Value value);

    static ObjectSchema object(Field... fields) {
        return new ObjectSchema(List.of(fields), List.of());
    }

    static ArraySchema arrayOf(Schema items) {
        return new ArraySchema(items, List.of());
    }

    static ScalarSchema string() {
        return new ScalarSchema(ScalarType.STRING, null);
    }

    static ScalarSchema number() {
        return new ScalarSchema(ScalarType.NUMBER, null);
    }

    static ScalarSchema integer() {
        return new ScalarSchema(ScalarType.INTEGER, null);
    }

    static ScalarSchema bool() {
        return new ScalarSchema(ScalarType.BOOLEAN, null);
    }

    static UndefinedSchema undefined() {
        return UndefinedSchema.INSTANCE;
    }
}
