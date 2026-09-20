package io.opencelium.common.invoker.operation;

import io.opencelium.common.invoker.schema.ArraySchema;
import io.opencelium.common.invoker.schema.ObjectSchema;
import io.opencelium.common.invoker.schema.ScalarSchema;
import io.opencelium.common.invoker.schema.Schema;
import io.opencelium.common.invoker.schema.UndefinedSchema;

import java.util.Arrays;
import java.util.List;

/**
 * A parameter sent in the query string.
 *
 * <p>In an invoker file:
 * <pre>{@code
 * <parameters>
 *     <parameter name="limit" type="integer">50</parameter>
 *     <parameter name="status" type="array" style="form" explode="false">
 *         <items type="string"/>
 *         <value>open</value>
 *     </parameter>
 * </parameters>
 * }</pre>
 *
 * <p>The schema and style must fit together, following OpenAPI 3.1: a single value is always
 * {@code form}; a list must hold simple values and may use {@code form}, {@code spaceDelimited} or
 * {@code pipeDelimited}; an object may use {@code form} or {@code deepObject}. A parameter of
 * unknown type is rejected, because it could not be written into a URL.
 *
 * @param name    the parameter name as it appears in the URL
 * @param schema  the type of the value, with its default
 * @param style   how a list or object is written; see {@link QueryStyle}
 * @param explode whether each element becomes its own {@code name=value} pair
 */
public record QueryParameter(String name, Schema schema, QueryStyle style, boolean explode) {

    public QueryParameter {
        switch (schema) {
            case ScalarSchema _ -> requireStyle(name, schema, style, QueryStyle.FORM);
            case ArraySchema array -> {
                if (!(array.items() instanceof ScalarSchema)) {
                    throw new IllegalArgumentException("query parameter '" + name + "' is a list of '"
                            + array.items().typeName() + "'; a query string can only carry a list of simple values");
                }
                requireStyle(name, schema, style,
                        QueryStyle.FORM, QueryStyle.SPACE_DELIMITED, QueryStyle.PIPE_DELIMITED);
            }
            case ObjectSchema _ -> requireStyle(name, schema, style, QueryStyle.FORM, QueryStyle.DEEP_OBJECT);
            case UndefinedSchema _ -> throw new IllegalArgumentException("query parameter '" + name
                    + "' has type 'undefined'; a value must have a known type to be written into a URL");
        }
    }

    /**
     * A parameter with the OpenAPI defaults for a query parameter: style {@code form}, exploded.
     */
    public static QueryParameter of(String name, Schema schema) {
        return new QueryParameter(name, schema, QueryStyle.FORM, true);
    }

    /**
     * A parameter with the given style and the OpenAPI default for {@code explode}, which is
     * {@code true} for {@code form} and {@code false} for every other style.
     */
    public static QueryParameter of(String name, Schema schema, QueryStyle style) {
        return new QueryParameter(name, schema, style, style == QueryStyle.FORM);
    }

    private static void requireStyle(String name, Schema schema, QueryStyle style, QueryStyle... allowed) {
        if (!Arrays.asList(allowed).contains(style)) {
            List<String> names = Arrays.stream(allowed).map(QueryStyle::value).toList();
            throw new IllegalArgumentException("query parameter '" + name + "' of type '" + schema.typeName()
                    + "' cannot use style '" + style.value() + "'; allowed: " + String.join(", ", names));
        }
    }
}
