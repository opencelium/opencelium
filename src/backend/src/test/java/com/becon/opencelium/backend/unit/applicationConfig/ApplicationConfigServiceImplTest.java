/*
 * Copyright (C) 2020 becon GmbH
 *
 * This program is free software: you can redistribute it and/or modify
 * it under the terms of the GNU General Public License as published by
 * the Free Software Foundation, version 3 of the License.
 */

package com.becon.opencelium.backend.unit.applicationConfig;

import com.becon.opencelium.backend.applicationConfig.dto.ApplicationConfigResponse;
import com.becon.opencelium.backend.applicationConfig.service.ApplicationConfigServiceImpl;
import com.becon.opencelium.backend.applicationConfig.service.AtomicFileWriter;
import com.becon.opencelium.backend.applicationConfig.service.YamlConfigReader;
import com.becon.opencelium.backend.applicationConfig.service.YamlConfigWriter;
import com.becon.opencelium.backend.exception.ApplicationConfigWriteException;
import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.io.TempDir;

import java.io.IOException;
import java.nio.charset.StandardCharsets;
import java.nio.file.Files;
import java.nio.file.Path;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.mock;
import static org.mockito.Mockito.when;

@DisplayName("ApplicationConfigServiceImpl — read/patch orchestration")
class ApplicationConfigServiceImplTest {

    private final ObjectMapper json = new ObjectMapper();

    @Test
    void readReturnsParsedDataAndCommentsWhenFileExists(@TempDir Path tempDir) throws IOException {
        Path target = tempDir.resolve("application.yml");
        Files.writeString(target, """
                # header
                server:
                  port: 9090   # default
                """, StandardCharsets.UTF_8);

        ApplicationConfigServiceImpl svc = new ApplicationConfigServiceImpl(
                new YamlConfigReader(),
                new YamlConfigWriter(),
                new AtomicFileWriter(tempDir.resolve("backups"), 10),
                target.toString()
        );

        ApplicationConfigResponse response = svc.read();

        assertThat(response.data().get("server").get("port").asInt()).isEqualTo(9090);
        assertThat(response.comments()).isNotEmpty();
    }

    @Test
    void patchWritesMergedContentAndCreatesBackupWhenInputIsValid(@TempDir Path tempDir) throws IOException {
        Path target = tempDir.resolve("application.yml");
        String original = """
                server:
                  port: 9090   # http port
                """;
        Files.writeString(target, original, StandardCharsets.UTF_8);

        ApplicationConfigServiceImpl svc = new ApplicationConfigServiceImpl(
                new YamlConfigReader(),
                new YamlConfigWriter(),
                new AtomicFileWriter(tempDir.resolve("backups"), 10),
                target.toString()
        );

        JsonNode patch = json.readTree("""
                { "server": { "port": 8080 } }
                """);
        svc.patch(patch);

        String after = Files.readString(target);
        assertThat(after).contains("port: 8080");
        assertThat(after).contains("# http port");

        Path backupDir = tempDir.resolve("backups");
        try (var stream = Files.list(backupDir)) {
            assertThat(stream
                    .filter(p -> p.getFileName().toString().startsWith("application.yml.bak."))
                    .count())
                    .isEqualTo(1L);
        }
        // Backup must not pollute the target's directory.
        try (var stream = Files.list(tempDir)) {
            assertThat(stream
                    .filter(p -> p.getFileName().toString().startsWith("application.yml.bak."))
                    .count())
                    .isZero();
        }
    }

    @Test
    void patchLeavesOriginalUntouchedWhenWriterThrows(@TempDir Path tempDir) throws IOException {
        Path target = tempDir.resolve("application.yml");
        String original = """
                server:
                  port: 9090
                """;
        Files.writeString(target, original, StandardCharsets.UTF_8);

        YamlConfigWriter throwing = mock(YamlConfigWriter.class);
        when(throwing.merge(any(), any())).thenThrow(new ApplicationConfigWriteException("boom"));

        ApplicationConfigServiceImpl svc = new ApplicationConfigServiceImpl(
                new YamlConfigReader(),
                throwing,
                new AtomicFileWriter(tempDir.resolve("backups"), 10),
                target.toString()
        );

        JsonNode patch = json.readTree("""
                { "server": { "port": 8080 } }
                """);

        assertThatThrownBy(() -> svc.patch(patch))
                .isInstanceOf(ApplicationConfigWriteException.class);
        assertThat(Files.readString(target)).isEqualTo(original);
    }

    @Test
    void patchThrowsWhenPayloadIsNotAnObject(@TempDir Path tempDir) throws IOException {
        Path target = tempDir.resolve("application.yml");
        Files.writeString(target, "key: value\n", StandardCharsets.UTF_8);

        ApplicationConfigServiceImpl svc = new ApplicationConfigServiceImpl(
                new YamlConfigReader(),
                new YamlConfigWriter(),
                new AtomicFileWriter(tempDir.resolve("backups"), 10),
                target.toString()
        );

        JsonNode bad = json.readTree("[1, 2, 3]");

        assertThatThrownBy(() -> svc.patch(bad))
                .isInstanceOf(ApplicationConfigWriteException.class);
    }
}
