package io.opencelium.common.invoker.schema;

import java.util.HashSet;
import java.util.List;
import java.util.Objects;
import java.util.Optional;
import java.util.Set;

/**
 * A structure of named fields.
 *
 * <p>In an invoker file:
 * <pre>{@code
 * <field name="assignee" type="object">
 *     <field name="id"   type="integer"/>
 *     <field name="name" type="string"/>
 * </field>
 * }</pre>
 *
 * <p>Fields keep the order they were declared in. Order is meaningful for XML payloads and for
 * form-encoded bodies, and a user reading the field picker expects the order of the API's own
 * documentation.
 *
 * @param fields     the named members, in declaration order; names are unique
 * @param attributes XML attributes of this element; always empty for non-XML payloads
 */
public record ObjectSchema(List<Field> fields, List<XmlAttribute> attributes) implements Schema {

    public ObjectSchema {
        Objects.requireNonNull(fields, "object fields must not be null");
        Objects.requireNonNull(attributes, "object attributes must not be null");
        fields = List.copyOf(fields);
        attributes = List.copyOf(attributes);
        requireUnique(fields.stream().map(Field::name).toList(), "field");
        requireUnique(attributes.stream().map(XmlAttribute::name).toList(), "attribute");
    }

    /** The field with exactly this name. Names are case-sensitive, as JSON keys are. */
    public Optional<Field> field(String name) {
        return fields.stream().filter(field -> field.name().equals(name)).findFirst();
    }

    /** A copy of this schema carrying the given XML attributes. */
    public ObjectSchema withAttributes(XmlAttribute... attributes) {
        return new ObjectSchema(fields, List.of(attributes));
    }

    @Override
    public String typeName() {
        return "object";
    }

    /**
     * Accepts an object whose every key is a declared field holding a value that field accepts.
     * Declared fields may be missing: a default rarely sets every field.
     */
    @Override
    public boolean accepts(Value value) {
        return value instanceof Value.ObjectValue(var values)
                && values.entrySet().stream().allMatch(entry -> field(entry.getKey())
                        .map(field -> field.schema().accepts(entry.getValue()))
                        .orElse(false));
    }

    private static void requireUnique(List<String> names, String kind) {
        Set<String> seen = new HashSet<>();
        for (String name : names) {
            if (!seen.add(name)) {
                throw new IllegalArgumentException(kind + " '" + name + "' is declared more than once");
            }
        }
    }
}
