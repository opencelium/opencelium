package io.opencelium.common.invoker.operation;

import io.opencelium.common.http.ContentType;
import io.opencelium.common.invoker.schema.Schema;
import org.junit.jupiter.api.Test;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;

class BodyTest {

    @Test
    void constructorThrowsWhenNamespaceIsGivenForANonXmlBody() {
        XmlNamespace namespace = XmlNamespace.of("http://acme.com/v1", "a");

        assertThatThrownBy(() -> new Body(ContentType.APPLICATION_JSON, Schema.object(), null, namespace))
                .isInstanceOf(IllegalArgumentException.class)
                .hasMessage("a target namespace applies only to XML bodies, but this body is application/json");
    }

    @Test
    void constructorAcceptsNamespaceWhenBodyUsesAnXmlSuffixType() {
        Body atom = new Body(ContentType.parse("application/atom+xml"), Schema.object(), null,
                XmlNamespace.of("http://www.w3.org/2005/Atom", null));

        assertThat(atom.xmlNamespace()).isNotNull();
    }

    @Test
    void constructorThrowsWhenNamespaceIsGivenWithoutSchema() {
        XmlNamespace namespace = XmlNamespace.of("http://acme.com/v1", "a");

        assertThatThrownBy(() -> new Body(ContentType.APPLICATION_XML, null, null, namespace))
                .isInstanceOf(IllegalArgumentException.class)
                .hasMessage("a target namespace belongs to the body's schema, but this body has no schema");
    }

    @Test
    void constructorThrowsWhenGraphqlEnvelopeIsNotJson() {
        assertThatThrownBy(() -> new Body(ContentType.TEXT_PLAIN, null, BodyEnvelope.GRAPHQL, null))
                .isInstanceOf(IllegalArgumentException.class)
                .hasMessage("a graphql envelope is sent as JSON, but this body is text/plain");
    }

    @Test
    void constructorThrowsWhenFormEncodedBodyIsNotAnObject() {
        assertThatThrownBy(() -> Body.of(ContentType.APPLICATION_FORM_URLENCODED, Schema.arrayOf(Schema.string())))
                .isInstanceOf(IllegalArgumentException.class)
                .hasMessage("a application/x-www-form-urlencoded body is a set of named fields, "
                        + "so its schema must be 'object', not 'array'");
    }

    @Test
    void constructorThrowsWhenNamespacePrefixIsNotAnXmlName() {
        assertThatThrownBy(() -> XmlNamespace.of("http://acme.com/v1", "1bad"))
                .isInstanceOf(IllegalArgumentException.class)
                .hasMessage("'1bad' is not a valid namespace prefix");
    }

    @Test
    void opaqueCreatesABodyWithoutSchema() {
        assertThat(Body.opaque(ContentType.parse("application/pdf")).schema()).isNull();
    }

    // ── builder ───────────────────────────────────────────

    @Test
    void builderAppliesTheSameRulesAsTheConstructor() {
        Body.Builder jsonWithNamespace = Body.builder(ContentType.APPLICATION_JSON)
                .schema(Schema.object())
                .xmlNamespace(XmlNamespace.of("http://acme.com/v1", "a"));

        assertThatThrownBy(jsonWithNamespace::build)
                .isInstanceOf(IllegalArgumentException.class)
                .hasMessage("a target namespace applies only to XML bodies, but this body is application/json");
    }
}
