package io.opencelium.common.invoker.schema;

import java.util.Objects;

/**
 * An attribute on an XML element, as opposed to a child element.
 *
 * <p>In an invoker file:
 * <pre>{@code
 * <field name="ticket" type="object">
 *     <attribute name="id" type="integer">{ticketId}</attribute>
 *     <field name="subject" type="string"/>
 * </field>
 * }</pre>
 * describes {@code <ticket id="123"><subject/></ticket>}.
 *
 * <p>An attribute always holds a single value, so its schema is always a {@link ScalarSchema}.
 *
 * @param name   the attribute name, optionally with a namespace prefix such as {@code xsi:type}
 * @param schema the type and default value of the attribute
 */
public record XmlAttribute(String name, ScalarSchema schema) {

    public XmlAttribute {
        Objects.requireNonNull(name, "attribute name must not be null");
        Objects.requireNonNull(schema, "schema of attribute '" + name + "' must not be null");
    }

    public static XmlAttribute of(String name, ScalarSchema schema) {
        return new XmlAttribute(name, schema);
    }
}
