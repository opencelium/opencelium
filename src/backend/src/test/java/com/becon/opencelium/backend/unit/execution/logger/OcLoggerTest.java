package com.becon.opencelium.backend.unit.execution.logger;

import static org.assertj.core.api.Assertions.assertThat;

import com.becon.opencelium.backend.execution.logger.OcLogger;
import java.nio.charset.StandardCharsets;
import java.util.Base64;
import java.util.List;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;

/**
 * Unit tests for {@link OcLogger#hideIn(String, java.util.Collection)}, the rule by which a run
 * log line hides the values of secret global variables. The logger itself writes to a file and
 * is not built here.
 *
 * <p>Run with: ./gradlew test --tests "*.OcLoggerTest"
 */
@DisplayName("OcLogger — unit")
class OcLoggerTest {

    @Test
    @DisplayName("hideIn — a text that holds another one is hidden as a whole, not in pieces")
    void hideInMasksLongerTextFirstWhenTextsOverlap() {
        String line = OcLogger.hideIn("Authorization: Bearer s3cr3t-token", List.of("s3cr3t", "s3cr3t-token"));

        assertThat(line).isEqualTo("Authorization: Bearer " + OcLogger.HIDDEN_MASK);
    }

    @Test
    @DisplayName("hideIn — an empty text would put the mask between every character, so it is skipped")
    void hideInLeavesTextWhenHiddenTextIsEmpty() {
        String line = OcLogger.hideIn("segment=REQUEST url=https://api.example", List.of(""));

        assertThat(line).isEqualTo("segment=REQUEST url=https://api.example");
    }

    @Test
    @DisplayName("hideIn — a secret inside Base64 Basic credentials is hidden with the credentials")
    void hideInMasksBasicCredentialsWhenDecodedCredentialsHoldHiddenText() {
        String credentials = base64("admin:s3cr3t-QA-value");

        String line = OcLogger.hideIn("\"Authorization\" : [ \"Basic " + credentials + "\" ]", List.of("s3cr3t-QA-value"));

        assertThat(line).isEqualTo("\"Authorization\" : [ \"Basic " + OcLogger.HIDDEN_MASK + "\" ]");
    }

    @Test
    void hideInKeepsBasicCredentialsWhenDecodedCredentialsHoldNoHiddenText() {
        String header = "Authorization: Basic " + base64("admin:admin");

        String line = OcLogger.hideIn(header, List.of("s3cr3t-QA-value"));

        assertThat(line).isEqualTo(header);
    }

    @Test
    void hideInKeepsTextWhenBasicIsFollowedByNoBase64() {
        String line = OcLogger.hideIn("Basic plan: s3cr3t", List.of("s3cr3t"));

        assertThat(line).isEqualTo("Basic plan: " + OcLogger.HIDDEN_MASK);
    }

    @Test
    void hideInReturnsNullWhenTextIsNull() {
        String line = OcLogger.hideIn(null, List.of("s3cr3t"));

        assertThat(line).isNull();
    }

    private static String base64(String text) {
        return Base64.getEncoder().encodeToString(text.getBytes(StandardCharsets.UTF_8));
    }
}
