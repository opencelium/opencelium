/*
 * Copyright (C) 2020 becon GmbH
 *
 * This program is free software: you can redistribute it and/or modify
 * it under the terms of the GNU General Public License as published by
 * the Free Software Foundation, version 3 of the License.
 */

package com.becon.opencelium.backend.unit.applicationConfig;

import com.becon.opencelium.backend.applicationConfig.service.AtomicFileWriter;
import com.becon.opencelium.backend.exception.ApplicationConfigWriteException;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.io.TempDir;

import java.io.IOException;
import java.nio.charset.StandardCharsets;
import java.nio.file.Files;
import java.nio.file.Path;
import java.time.Clock;
import java.time.Instant;
import java.time.ZoneOffset;
import java.util.List;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;

@DisplayName("AtomicFileWriter — backup, temp, atomic rename, retention")
class AtomicFileWriterTest {

    @Test
    void writeReplacesContentAndCreatesBackupInBackupDirectoryWhenTargetExists(@TempDir Path tempDir) throws IOException {
        Path target = tempDir.resolve("application.yml");
        Path backupDir = tempDir.resolve("backups");
        Files.writeString(target, "key: old\n", StandardCharsets.UTF_8);

        new AtomicFileWriter(backupDir, 10).write(target, "key: new\n");

        assertThat(Files.readString(target)).isEqualTo("key: new\n");
        List<Path> backups = backupsIn(backupDir, "application.yml");
        assertThat(backups).hasSize(1);
        assertThat(Files.readString(backups.get(0))).isEqualTo("key: old\n");
        // Backup is in the dedicated directory, not next to the target.
        assertThat(backupsIn(tempDir, "application.yml")).isEmpty();
    }

    @Test
    void writeCreatesBackupDirectoryWhenItDoesNotYetExist(@TempDir Path tempDir) throws IOException {
        Path target = tempDir.resolve("application.yml");
        Path nestedBackupDir = tempDir.resolve("runtime/backup/application");
        Files.writeString(target, "key: old\n", StandardCharsets.UTF_8);

        new AtomicFileWriter(nestedBackupDir, 10).write(target, "key: new\n");

        assertThat(Files.isDirectory(nestedBackupDir)).isTrue();
        assertThat(backupsIn(nestedBackupDir, "application.yml")).hasSize(1);
    }

    @Test
    void writeCreatesNewFileWhenTargetDoesNotYetExist(@TempDir Path tempDir) throws IOException {
        Path target = tempDir.resolve("application.yml");
        Path backupDir = tempDir.resolve("backups");

        new AtomicFileWriter(backupDir, 10).write(target, "key: new\n");

        assertThat(Files.readString(target)).isEqualTo("key: new\n");
        assertThat(backupsIn(backupDir, "application.yml")).isEmpty();
    }

    @Test
    void writeThrowsAndLeavesOriginalUntouchedWhenTempCannotBeCreated(@TempDir Path tempDir) throws IOException {
        Path fakeParent = tempDir.resolve("not-a-dir");
        Files.writeString(fakeParent, "I am a file, not a directory", StandardCharsets.UTF_8);
        Path target = fakeParent.resolve("application.yml");
        Path backupDir = tempDir.resolve("backups");

        assertThatThrownBy(() -> new AtomicFileWriter(backupDir, 10).write(target, "irrelevant"))
                .isInstanceOf(ApplicationConfigWriteException.class);

        assertThat(Files.readString(fakeParent)).isEqualTo("I am a file, not a directory");
    }

    @Test
    void writeKeepsOnlyTheConfiguredNumberOfBackupsWhenManyWritesAccumulate(@TempDir Path tempDir) throws IOException {
        Path target = tempDir.resolve("application.yml");
        Path backupDir = tempDir.resolve("backups");
        Files.writeString(target, "key: v0\n", StandardCharsets.UTF_8);

        // Advance the clock between writes so each backup gets a unique
        // epochMillis suffix; the writer's pruning sorts on that.
        for (int i = 1; i <= 5; i++) {
            Clock fixed = Clock.fixed(Instant.ofEpochMilli(1_000_000_000_000L + i), ZoneOffset.UTC);
            new AtomicFileWriter(fixed, backupDir, 3)
                    .write(target, "key: v" + i + "\n");
        }

        List<Path> backups = backupsIn(backupDir, "application.yml");
        assertThat(backups).hasSize(3);
        // The three retained backups must be the three most recent — i.e. the
        // ones created for writes 3, 4 and 5 (which backed up versions v2-v4).
        List<String> retainedSuffixes = backups.stream()
                .map(p -> p.getFileName().toString().substring("application.yml.bak.".length()))
                .sorted()
                .toList();
        assertThat(retainedSuffixes).containsExactly(
                "1000000000003", "1000000000004", "1000000000005");
    }

    @Test
    void constructorRejectsKeepBelowOne() {
        assertThatThrownBy(() -> new AtomicFileWriter(Path.of("backups"), 0))
                .isInstanceOf(IllegalArgumentException.class);
    }

    private static List<Path> backupsIn(Path dir, String prefix) throws IOException {
        if (!Files.isDirectory(dir)) {
            return List.of();
        }
        try (var stream = Files.list(dir)) {
            return stream
                    .filter(p -> p.getFileName().toString().startsWith(prefix + ".bak."))
                    .toList();
        }
    }
}
