package io.opencelium.common.http;

import org.junit.jupiter.api.Test;
import org.junit.jupiter.params.ParameterizedTest;
import org.junit.jupiter.params.provider.ValueSource;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;

class ContentTypeTest {

    // ── parse ─────────────────────────────────────────────

    @Test
    void parseDropsParametersWhenCharsetIsGiven() {
        assertThat(ContentType.parse("application/json; charset=utf-8")).isEqualTo(ContentType.APPLICATION_JSON);
    }

    @Test
    void parseIgnoresCaseWhenTypeIsWrittenInUpperCase() {
        assertThat(ContentType.parse("Application/JSON")).isEqualTo(ContentType.APPLICATION_JSON);
    }

    @ParameterizedTest
    @ValueSource(strings = {"json", "/json", "application/", ""})
    void parseThrowsWhenTextIsNotTypeSlashSubtype(String text) {
        assertThatThrownBy(() -> ContentType.parse(text))
                .isInstanceOf(IllegalArgumentException.class)
                .hasMessage("'" + text + "' is not a media type; expected type/subtype, for example application/json");
    }

    @Test
    void toStringReturnsCanonicalForm() {
        assertThat(ContentType.parse(" TEXT/Plain ; charset=ascii")).hasToString("text/plain");
    }

    // ── suffix ────────────────────────────────────────────

    @Test
    void suffixReturnsTheStructuredSyntaxSuffix() {
        assertThat(ContentType.parse("application/vnd.api+json").suffix()).contains("json");
        assertThat(ContentType.APPLICATION_JSON.suffix()).isEmpty();
    }

    // ── families ──────────────────────────────────────────

    @ParameterizedTest
    @ValueSource(strings = {"application/json", "text/json", "application/vnd.api+json", "application/problem+json"})
    void isJsonReturnsTrueWhenSubtypeIsJsonOrHasJsonSuffix(String text) {
        assertThat(ContentType.parse(text).isJson()).isTrue();
    }

    @ParameterizedTest
    @ValueSource(strings = {"application/jsonl", "application/x-json-stream", "application/xml"})
    void isJsonReturnsFalseWhenJsonOnlyAppearsInsideSubtype(String text) {
        assertThat(ContentType.parse(text).isJson()).isFalse();
    }

    @ParameterizedTest
    @ValueSource(strings = {"application/xml", "text/xml", "application/atom+xml"})
    void isXmlReturnsTrueWhenSubtypeIsXmlOrHasXmlSuffix(String text) {
        assertThat(ContentType.parse(text).isXml()).isTrue();
    }

    @Test
    void isTextAndIsXmlBothReturnTrueWhenTypeIsTextXml() {
        ContentType textXml = ContentType.parse("text/xml");

        assertThat(textXml.isXml()).isTrue();
        assertThat(textXml.isText()).isTrue();
    }

    @Test
    void isMultipartReturnsTrueForAnyMultipartSubtype() {
        assertThat(ContentType.parse("multipart/mixed").isMultipart()).isTrue();
        assertThat(ContentType.APPLICATION_FORM_URLENCODED.isMultipart()).isFalse();
    }

    @Test
    void isFormUrlEncodedReturnsTrueOnlyForFormUrlEncoded() {
        assertThat(ContentType.parse("application/x-www-form-urlencoded; charset=utf-8").isFormUrlEncoded()).isTrue();
        assertThat(ContentType.MULTIPART_FORM_DATA.isFormUrlEncoded()).isFalse();
    }
}
