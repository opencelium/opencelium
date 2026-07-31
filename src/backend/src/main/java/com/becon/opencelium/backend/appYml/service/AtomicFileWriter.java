/*
 * // Copyright (C) <2020> <becon GmbH>
 * //
 * // This program is free software: you can redistribute it and/or modify
 * // it under the terms of the GNU General Public License as published by
 * // the Free Software Foundation, version 3 of the License.
 * //
 * // This program is distributed in the hope that it will be useful,
 * // but WITHOUT ANY WARRANTY; without even the implied warranty of
 * // MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE. See the
 * // GNU General Public License for more details.
 * //
 * // You should have received a copy of the GNU General Public License
 * // along with this program. If not, see <http://www.gnu.org/licenses/>.
 */

package com.becon.opencelium.backend.appYml.service;

import com.becon.opencelium.backend.exception.ApplicationConfigWriteException;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Component;

import java.io.IOException;
import java.nio.charset.StandardCharsets;
import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.Paths;
import java.nio.file.StandardCopyOption;
import java.time.Clock;
import java.time.Instant;
import java.util.Comparator;
import java.util.List;
import java.util.stream.Stream;

@Component
public class AtomicFileWriter {

    private final Clock clock;
    private final Path backupDirectory;
    private final int keepBackups;

    @Autowired
    public AtomicFileWriter(
            @Value("${opencelium.config.backup.directory:runtime/backup/application}") String backupDirectory,
            @Value("${opencelium.config.backup.keep:10}") int keepBackups
    ) {
        this(Clock.systemUTC(), Paths.get(backupDirectory), keepBackups);
    }

    public AtomicFileWriter(Path backupDirectory, int keepBackups) {
        this(Clock.systemUTC(), backupDirectory, keepBackups);
    }

    public AtomicFileWriter(Clock clock, Path backupDirectory, int keepBackups) {
        if (keepBackups < 1) {
            throw new IllegalArgumentException("keepBackups must be >= 1, got " + keepBackups);
        }
        this.clock = clock;
        this.backupDirectory = backupDirectory;
        this.keepBackups = keepBackups;
    }

    public void write(Path target, String content) {
        Path parent = target.toAbsolutePath().getParent();
        if (parent == null) {
            throw new ApplicationConfigWriteException("Target path has no parent directory: " + target);
        }

        try {
            Files.createDirectories(backupDirectory);
        } catch (IOException e) {
            throw new ApplicationConfigWriteException(
                    "Failed to create backup directory " + backupDirectory, e);
        }

        Path backup = backupDirectory.resolve(
                target.getFileName() + ".bak." + Instant.now(clock).toEpochMilli());
        Path temp;

        try {
            if (Files.exists(target)) {
                Files.copy(target, backup, StandardCopyOption.REPLACE_EXISTING);
            }
        } catch (IOException e) {
            throw new ApplicationConfigWriteException("Failed to create backup of " + target, e);
        }

        try {
            temp = Files.createTempFile(parent, target.getFileName().toString(), ".tmp");
        } catch (IOException e) {
            throw new ApplicationConfigWriteException("Failed to create temp file for " + target, e);
        }

        try {
            Files.writeString(temp, content, StandardCharsets.UTF_8);
            Files.move(temp, target,
                    StandardCopyOption.REPLACE_EXISTING, StandardCopyOption.ATOMIC_MOVE);
        } catch (IOException e) {
            try {
                Files.deleteIfExists(temp);
            } catch (IOException ignored) {
                // best-effort cleanup; original file is still intact
            }
            throw new ApplicationConfigWriteException("Failed to write " + target, e);
        }

        pruneOldBackups(target.getFileName().toString());
    }

    /**
     * Deletes the oldest backups for {@code targetFilename} so that at most
     * {@code keepBackups} remain. Best-effort: any I/O failure is swallowed —
     * the write has already succeeded, an extra stale backup file is not worth
     * surfacing to the caller.
     */
    private void pruneOldBackups(String targetFilename) {
        String prefix = targetFilename + ".bak.";
        List<Path> backups;
        try (Stream<Path> stream = Files.list(backupDirectory)) {
            backups = stream
                    .filter(p -> p.getFileName().toString().startsWith(prefix))
                    .sorted(Comparator.comparing(
                            (Path p) -> p.getFileName().toString()).reversed())
                    .toList();
        } catch (IOException ignored) {
            return;
        }
        for (int i = keepBackups; i < backups.size(); i++) {
            try {
                Files.deleteIfExists(backups.get(i));
            } catch (IOException ignored) {
                // best-effort; nothing actionable here
            }
        }
    }
}
