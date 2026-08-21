package com.becon.opencelium.backend.unit.utility;

import com.becon.opencelium.backend.exception.GeneralServiceException;
import com.becon.opencelium.backend.utility.InvokerNameUtils;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.params.ParameterizedTest;
import org.junit.jupiter.params.provider.CsvSource;
import org.junit.jupiter.params.provider.NullAndEmptySource;
import org.junit.jupiter.params.provider.ValueSource;
import org.springframework.http.HttpStatus;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatCode;
import static org.assertj.core.api.Assertions.assertThatThrownBy;

@DisplayName("InvokerNameUtils — unit")
class InvokerNameUtilsTest {

    // ── isValid ───────────────────────────────────────────────────────────────

    @ParameterizedTest
    @ValueSource(strings = {
            "Jira",
            "KIX",
            "i-doit",
            "Dell Warranty",
            "fake_api",
            "SnowInventory",
            "Invoker (v2)",
            "OTRS 6 (test)",
            "api.v2",
            "a.b.c",
            "Ürlaubsverwaltung",
            "2go",
            "-leading-dash",
            "trailing_underscore_",
            "a"
    })
    void isValidReturnsTrueForNameFollowingThePolicy(String name) {
        assertThat(InvokerNameUtils.isValid(name)).isTrue();
    }

    @ParameterizedTest
    @NullAndEmptySource
    @ValueSource(strings = {
            "   ",
            ".",
            ".jira",
            "jira.",
            "ji..ra",
            "..",
            "../../etc/passwd",
            "Jira/Confluence",
            "Jira\\Confluence",
            "Jira:1",
            "Jira*",
            "Jira?",
            "Jira|Confluence",
            "Jira\"",
            "Jira<x>",
            "Jira%20Cloud",
            "Jira+Cloud",
            "Jira#1",
            "Jira,Cloud",
            "Jira;drop"
    })
    void isValidReturnsFalseForNameBreakingThePolicy(String name) {
        assertThat(InvokerNameUtils.isValid(name)).isFalse();
    }

    @Test
    void isValidAcceptsTheMaximumLengthAndRejectsOneCharacterMore() {
        assertThat(InvokerNameUtils.isValid("a".repeat(InvokerNameUtils.MAX_LENGTH))).isTrue();
        assertThat(InvokerNameUtils.isValid("a".repeat(InvokerNameUtils.MAX_LENGTH + 1))).isFalse();
    }

    @Test
    void isValidLeavesRoomForTheXmlExtensionWithinTheFileNameLimit() {
        // the backend stores the invoker as '<name>.xml', and file systems cap a name at 255 bytes
        assertThat(InvokerNameUtils.MAX_LENGTH + ".xml".length()).isLessThan(250);
    }

    // ── normalize ─────────────────────────────────────────────────────────────

    @ParameterizedTest
    @CsvSource(delimiter = '|', value = {
            "  Jira  |Jira",
            "Dell   Warranty|Dell Warranty",
            "Jira|Jira"
    })
    void normalizeTrimsAndCollapsesWhitespace(String given, String expected) {
        assertThat(InvokerNameUtils.normalize(given)).isEqualTo(expected);
    }

    @Test
    void normalizeReplacesTabsAndLineBreaksWithASingleSpace() {
        assertThat(InvokerNameUtils.normalize("\n Dell \t\r\n Warranty \t")).isEqualTo("Dell Warranty");
    }

    @Test
    void normalizeCollapsesTheNoBreakSpaceThatComesFromPastedNames() {
        assertThat(InvokerNameUtils.normalize("Dell\u00A0Warranty")).isEqualTo("Dell Warranty");
        assertThat(InvokerNameUtils.isValid("Dell\u00A0Warranty")).isTrue();
    }

    @Test
    void normalizeReturnsNullForNull() {
        assertThat(InvokerNameUtils.normalize(null)).isNull();
    }

    // ── validate ──────────────────────────────────────────────────────────────

    @Test
    void validateReturnsTheNormalizedNameWhenNameFollowsThePolicy() {
        assertThat(InvokerNameUtils.validate("  Dell   Warranty ")).isEqualTo("Dell Warranty");
    }

    @Test
    void validateRejectsAnEmptyNameWithABadRequest() {
        assertThatThrownBy(() -> InvokerNameUtils.validate("   "))
                .isInstanceOf(GeneralServiceException.class)
                .hasMessageContaining("must not be empty")
                .extracting(e -> ((GeneralServiceException) e).getError(),
                        e -> ((GeneralServiceException) e).getStatus())
                .containsExactly(InvokerNameUtils.INVALID_NAME_ERROR, HttpStatus.BAD_REQUEST);
    }

    @Test
    void validateRejectsANameLongerThanTheMaximumLength() {
        String tooLong = "a".repeat(InvokerNameUtils.MAX_LENGTH + 1);

        assertThatThrownBy(() -> InvokerNameUtils.validate(tooLong))
                .isInstanceOf(GeneralServiceException.class)
                .hasMessageContaining(String.valueOf(InvokerNameUtils.MAX_LENGTH))
                .extracting(e -> ((GeneralServiceException) e).getError())
                .isEqualTo(InvokerNameUtils.INVALID_NAME_ERROR);
    }

    @Test
    void validateRejectsANameThatWouldEscapeTheInvokerFolder() {
        assertThatThrownBy(() -> InvokerNameUtils.validate("../../etc/passwd"))
                .isInstanceOf(GeneralServiceException.class)
                .extracting(e -> ((GeneralServiceException) e).getError())
                .isEqualTo(InvokerNameUtils.INVALID_NAME_ERROR);
    }

    @Test
    void validateAcceptsANameThatOnlyBecomesValidAfterTrimming() {
        assertThatCode(() -> InvokerNameUtils.validate(" KIX ")).doesNotThrowAnyException();
    }

    // ── canonical / sameName ──────────────────────────────────────────────────

    @Test
    void canonicalIgnoresCaseAndExtraWhitespace() {
        assertThat(InvokerNameUtils.canonical("  Dell   WARRANTY ")).isEqualTo("dell warranty");
    }

    @Test
    void canonicalReturnsNullForNull() {
        assertThat(InvokerNameUtils.canonical(null)).isNull();
    }

    @ParameterizedTest
    @CsvSource(delimiter = '|', value = {
            "Jira|jira",
            "Jira|JIRA",
            "Dell Warranty|dell   warranty",
            "' KIX '|kix"
    })
    void sameNameMatchesNamesThatDifferOnlyInCaseOrWhitespace(String left, String right) {
        assertThat(InvokerNameUtils.sameName(left, right)).isTrue();
    }

    @ParameterizedTest
    @CsvSource(delimiter = '|', value = {
            "Jira|Jira Cloud",
            "Jira|",
            "|Jira",
            "|"
    })
    void sameNameDoesNotMatchDifferentOrMissingNames(String left, String right) {
        assertThat(InvokerNameUtils.sameName(left, right)).isFalse();
    }
}
