package com.becon.opencelium.backend.unit.application.language;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;

import com.becon.opencelium.backend.application.language.LanguageService;
import com.becon.opencelium.backend.application.language.LanguageServiceImpl;
import com.becon.opencelium.backend.constant.props.LanguageProps;
import java.util.List;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.params.ParameterizedTest;
import org.junit.jupiter.params.provider.NullSource;
import org.junit.jupiter.params.provider.ValueSource;

/**
 * Unit tests for {@link LanguageServiceImpl}.
 *
 * <p>No mocks: {@link LanguageProps} is a plain configuration holder, so the real object is the
 * cheapest and most faithful collaborator.
 */
@DisplayName("LanguageServiceImpl")
class LanguageServiceImplTest {

    private static LanguageService serviceWith(String defaultCode, String... supported) {
        return new LanguageServiceImpl(new LanguageProps(defaultCode, List.of(supported)));
    }

    private final LanguageService service = serviceWith("en", "en", "de");

    @Test
    void getDefaultReturnsConfiguredLanguage() {
        LanguageService german = serviceWith("de", "en", "de");

        assertThat(german.getDefault()).isEqualTo("de");
    }

    @Test
    @DisplayName("getSupported — preserves configured order, which is the order clients present")
    void getSupportedReturnsConfiguredLanguagesInOrder() {
        LanguageService germanFirst = serviceWith("de", "de", "en");

        assertThat(germanFirst.getSupported()).containsExactly("de", "en");
    }

    @Test
    void isSupportedReturnsTrueWhenLanguageIsConfigured() {
        assertThat(service.isSupported("de")).isTrue();
    }

    // ── normalization ─────────────────────────────────────────────────────────

    @Test
    @DisplayName("normalize — maps the legacy 'eng' still stored in detail.lang onto 'en'")
    void normalizeMapsLegacyThreeLetterCodeToIso6391() {
        assertThat(service.normalize("eng")).contains("en");
    }

    @Test
    @DisplayName("normalize — 'ger' is ISO 639-2/B, which the JDK cannot derive on its own")
    void normalizeMapsBibliographicCodeToIso6391() {
        assertThat(service.normalize("ger")).contains("de");
    }

    @Test
    void normalizeMapsTerminologicalCodeToIso6391() {
        assertThat(service.normalize("deu")).contains("de");
    }

    @ParameterizedTest
    @ValueSource(strings = {"en_US", "en-US", "en-GB"})
    void normalizeStripsRegionSubtag(String code) {
        assertThat(service.normalize(code)).contains("en");
    }

    @ParameterizedTest
    @ValueSource(strings = {"ENG", "De", "  en  "})
    void normalizeIsCaseInsensitive(String code) {
        assertThat(service.normalize(code)).isPresent();
    }

    @Test
    void normalizeResolvesEnglishDisplayName() {
        assertThat(service.normalize("English")).contains("en");
    }

    @Test
    @DisplayName("normalize — canonicalizes any real language, membership is isSupported's job")
    void normalizeReturnsCanonicalCodeWhenLanguageIsNotSupported() {
        assertThat(service.normalize("fra")).contains("fr");
        assertThat(service.isSupported("fra")).isFalse();
    }

    @ParameterizedTest
    @NullSource
    @ValueSource(strings = {"", "   "})
    void normalizeReturnsEmptyWhenCodeIsBlank(String code) {
        assertThat(service.normalize(code)).isEmpty();
    }

    @ParameterizedTest
    @ValueSource(strings = {"xx", "klingon", "123"})
    void normalizeReturnsEmptyWhenLanguageIsUnknown(String code) {
        assertThat(service.normalize(code)).isEmpty();
    }

    // ── membership ────────────────────────────────────────────────────────────

    @Test
    @DisplayName("isSupported — an existing client sending 'eng' must not be rejected")
    void isSupportedReturnsTrueWhenCodeIsLegacySpelling() {
        assertThat(service.isSupported("eng")).isTrue();
    }

    @Test
    void isSupportedReturnsFalseWhenLanguageIsNotConfigured() {
        assertThat(service.isSupported("fr")).isFalse();
    }

    @Test
    void isSupportedReturnsFalseWhenCodeIsUnknown() {
        assertThat(service.isSupported("xx")).isFalse();
    }

    // ── display names ─────────────────────────────────────────────────────────

    @Test
    @DisplayName("displayName — replaces the names LangEnum used to hard-code")
    void displayNameReturnsEnglishNameOfLanguage() {
        assertThat(service.displayName("de")).isEqualTo("German");
        assertThat(service.displayName("en")).isEqualTo("English");
    }

    @Test
    void displayNameThrowsIllegalArgumentExceptionWhenCodeIsUnknown() {
        assertThatThrownBy(() -> service.displayName("xx"))
                .isInstanceOf(IllegalArgumentException.class)
                .hasMessageContaining("xx");
    }

    // ── startup validation ────────────────────────────────────────────────────

    @Test
    void constructorThrowsIllegalStateExceptionWhenSupportedIsEmpty() {
        LanguageProps props = new LanguageProps("en", List.of());

        assertThatThrownBy(() -> new LanguageServiceImpl(props))
                .isInstanceOf(IllegalStateException.class)
                .hasMessageContaining("opencelium.language.supported");
    }

    @Test
    void constructorThrowsIllegalStateExceptionWhenSupportedContainsUnknownCode() {
        LanguageProps props = new LanguageProps("en", List.of("en", "xx"));

        assertThatThrownBy(() -> new LanguageServiceImpl(props))
                .isInstanceOf(IllegalStateException.class)
                .hasMessageContaining("opencelium.language.supported")
                .hasMessageContaining("xx");
    }

    @Test
    void constructorThrowsIllegalStateExceptionWhenDefaultIsNotSupported() {
        LanguageProps props = new LanguageProps("fr", List.of("en", "de"));

        assertThatThrownBy(() -> new LanguageServiceImpl(props))
                .isInstanceOf(IllegalStateException.class)
                .hasMessageContaining("opencelium.language.default")
                .hasMessageContaining("fr");
    }

    @Test
    @DisplayName("constructor — a sloppily written application.yml still yields standard codes")
    void constructorCanonicalizesConfiguredCodes() {
        LanguageService sloppy = serviceWith("ENG", "ENG", "de-DE");

        assertThat(sloppy.getSupported()).containsExactly("en", "de");
        assertThat(sloppy.getDefault()).isEqualTo("en");
    }

    @Test
    void constructorRemovesDuplicateLanguages() {
        LanguageService duplicated = serviceWith("en", "en", "eng", "en_US");

        assertThat(duplicated.getSupported()).containsExactly("en");
    }
}
