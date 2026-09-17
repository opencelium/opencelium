package io.opencelium.common.invoker.schema;

import java.util.Objects;
import java.util.regex.Pattern;

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

    /** An XML qualified name: an optional prefix, a colon, and a local name. */
    private static final Pattern QUALIFIED_NAME =
            Pattern.compile("(?:[A-Za-z_][\\w.\\-]*:)?[A-Za-z_][\\w.\\-]*");

    public XmlAttribute {
        Objects.requireNonNull(name, "attribute name must not be null");
        Objects.requireNonNull(schema, "schema of attribute '" + name + "' must not be null");
        if (!QUALIFIED_NAME.matcher(name).matches()) {
            throw new IllegalArgumentException("'" + name + "' is not a valid XML attribute name");
        }
    }

    public static XmlAttribute of(String name, ScalarSchema schema) {
        return new XmlAttribute(name, schema);
    }
}
