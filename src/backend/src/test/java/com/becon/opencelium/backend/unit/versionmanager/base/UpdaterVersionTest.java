package com.becon.opencelium.backend.unit.versionmanager.base;

import com.becon.opencelium.backend.versionmanager.base.UpdaterVersion;
import com.fasterxml.jackson.dataformat.yaml.YAMLMapper;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.params.ParameterizedTest;
import org.junit.jupiter.params.provider.CsvSource;
import org.junit.jupiter.params.provider.NullAndEmptySource;
import org.junit.jupiter.params.provider.ValueSource;

import java.io.IOException;
import java.io.InputStream;

import static org.assertj.core.api.Assertions.assertThat;

/**
 * Unit tests for {@link UpdaterVersion}.
 * <p>
 * Pure enum logic — no Spring context, no mocks. The shipped-version test reads
 * {@code application_default.yml} from the classpath.
 */
@DisplayName("UpdaterVersion — unit")
class UpdaterVersionTest {

    @ParameterizedTest(name = "latestUpTo(\"{0}\") = {1}")
    @CsvSource({
            "4.0,    VERSION_4_0",
            "4.4,    VERSION_4_4",
            "5.0,    VERSION_5_0",
            "5.2,    VERSION_5_2",
            "4.4.1,  VERSION_4_4",
            "5.2.1,  VERSION_5_2",
            "v4.5,   VERSION_4_5",
    })
    void latestUpToReturnsMatchingEntryWhenVersionHasItsOwnEntry(String version, UpdaterVersion expected) {
        assertThat(UpdaterVersion.latestUpTo(version)).isEqualTo(expected);
    }

    @ParameterizedTest(name = "latestUpTo(\"{0}\") = {1}")
    @CsvSource({
            "4.7,  VERSION_4_6",
            "4.9,  VERSION_4_8",
            "5.3,  VERSION_5_2",
            "5.10, VERSION_5_2",
            "6.0,  VERSION_5_2",
    })
    @DisplayName("a release without its own entry gets the newest older updater (5.3 regression)")
    void latestUpToReturnsNewestOlderEntryWhenVersionHasNoOwnEntry(String version, UpdaterVersion expected) {
        assertThat(UpdaterVersion.latestUpTo(version)).isEqualTo(expected);
    }

    @ParameterizedTest
    @NullAndEmptySource
    @ValueSource(strings = {"   ", "abc", "3.9", "0.1"})
    void latestUpToReturnsNoVersionWhenVersionIsBlankUnparsableOrTooOld(String version) {
        assertThat(UpdaterVersion.latestUpTo(version)).isEqualTo(UpdaterVersion.NO_VERSION);
    }

    @Test
    @DisplayName("opencelium.version in application_default.yml must select the newest updater")
    void latestUpToReturnsNewestEntryWhenGivenShippedVersion() throws IOException {
        String shippedVersion;
        try (InputStream yaml = getClass().getResourceAsStream("/application_default.yml")) {
            assertThat(yaml).as("application_default.yml on the classpath").isNotNull();
            shippedVersion = new YAMLMapper().readTree(yaml).at("/opencelium/version").asText();
        }
        UpdaterVersion[] versions = UpdaterVersion.values();

        assertThat(shippedVersion).isNotBlank();
        assertThat(UpdaterVersion.latestUpTo(shippedVersion))
                .as("updater version resolved for shipped opencelium.version '%s'", shippedVersion)
                .isEqualTo(versions[versions.length - 1]);
    }
}
