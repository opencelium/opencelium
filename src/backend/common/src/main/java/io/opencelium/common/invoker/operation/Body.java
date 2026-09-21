package io.opencelium.common.invoker.operation;

import io.opencelium.common.http.ContentType;
import io.opencelium.common.invoker.schema.ObjectSchema;
import io.opencelium.common.invoker.schema.Schema;

import java.util.Objects;

/**
 * The payload of a request or a response.
 *
 * <p>In an invoker file:
 * <pre>{@code
 * <body contentType="application/json">
 *     <schema type="object">
 *         <field name="subject" type="string"/>
 *     </schema>
 * </body>
 *
 * <body contentType="application/pdf"/>   <!-- opaque: no schema -->
 * }</pre>
 *
 * <p>The media type is stated here and only here. That single source replaces the several
 * overlapping ways earlier invoker files could express it.
 *
 * @param contentType  how the payload is encoded
 * @param schema       its structure, or {@code null} for an opaque payload such as a file download
 * @param envelope     a wrapping convention such as GraphQL, or {@code null} for a plain body
 * @param xmlNamespace the namespace of an XML payload, or {@code null}; only allowed on an XML body
 *                     that has a schema
 */
public record Body(
        ContentType contentType,
        Schema schema,
        String envelope,
        XmlNamespace xmlNamespace) {

    public Body {
        Objects.requireNonNull(contentType, "body content type must not be null");
        if (xmlNamespace != null && !contentType.isXml()) {
            throw new IllegalArgumentException("a target namespace applies only to XML bodies, "
                    + "but this body is " + contentType);
        }
        if (xmlNamespace != null && schema == null) {
            throw new IllegalArgumentException("a target namespace belongs to the body's schema, "
                    + "but this body has no schema");
        }
        if ("graphql".equals(envelope)  && !contentType.isJson()) {
            throw new IllegalArgumentException("a graphql envelope is sent as JSON, but this body is " + contentType);
        }
        boolean namedFieldsOnly = contentType.isFormUrlEncoded() || contentType.isMultipart();
        if (namedFieldsOnly && schema != null && !(schema instanceof ObjectSchema)) {
            throw new IllegalArgumentException("a " + contentType + " body is a set of named fields, "
                    + "so its schema must be 'object', not '" + schema.typeName() + "'");
        }
    }

    /** A plain body with a known structure. */
    public static Body of(ContentType contentType, Schema schema) {
        return new Body(contentType, schema, null, null);
    }
}
