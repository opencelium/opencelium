package com.becon.opencelium.backend.unit.execution.logger;

import static org.assertj.core.api.Assertions.assertThat;

import com.becon.opencelium.backend.execution.logger.OcLogger;
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
    void hideInReturnsNullWhenTextIsNull() {
        String line = OcLogger.hideIn(null, List.of("s3cr3t"));

        assertThat(line).isNull();
    }
}
