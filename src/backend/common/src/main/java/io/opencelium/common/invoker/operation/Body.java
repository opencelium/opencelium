package io.opencelium.common.invoker.operation;

import io.opencelium.common.http.ContentType;
import io.opencelium.common.invoker.schema.ObjectSchema;
import io.opencelium.common.invoker.schema.Schema;
import org.jspecify.annotations.Nullable;

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
        @Nullable Schema schema,
        @Nullable BodyEnvelope envelope,
        @Nullable XmlNamespace xmlNamespace) {

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
        if (envelope == BodyEnvelope.GRAPHQL && !contentType.isJson()) {
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

    /** A body whose contents are not described, such as a PDF or an image. */
    public static Body opaque(ContentType contentType) {
        return new Body(contentType, null, null, null);
    }

    /** Starts a body with its media type; schema, envelope and namespace are optional. */
    public static Builder builder(ContentType contentType) {
        return new Builder(contentType);
    }

    /**
     * Collects the parts of a body. {@link #build()} applies every rule of the {@link Body}
     * constructor.
     */
    public static final class Builder {

        private final ContentType contentType;
        private @Nullable Schema schema;
        private @Nullable BodyEnvelope envelope;
        private @Nullable XmlNamespace xmlNamespace;

        private Builder(ContentType contentType) {
            this.contentType = contentType;
        }

        public Builder schema(@Nullable Schema schema) {
            this.schema = schema;
            return this;
        }

        public Builder envelope(@Nullable BodyEnvelope envelope) {
            this.envelope = envelope;
            return this;
        }

        public Builder xmlNamespace(@Nullable XmlNamespace xmlNamespace) {
            this.xmlNamespace = xmlNamespace;
            return this;
        }

        /**
         * @throws IllegalArgumentException if the parts break a rule of {@link Body}
         */
        public Body build() {
            return new Body(contentType, schema, envelope, xmlNamespace);
        }
    }
}
