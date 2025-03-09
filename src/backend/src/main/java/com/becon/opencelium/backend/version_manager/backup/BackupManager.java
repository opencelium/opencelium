package com.becon.opencelium.backend.version_manager.backup;

import com.becon.opencelium.backend.resource.connection.ConnectionDTO;
import com.becon.opencelium.backend.template.entity.Template;
import com.fasterxml.jackson.databind.ObjectMapper;

import java.io.BufferedWriter;
import java.io.File;
import java.io.IOException;
import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.Paths;
import java.nio.file.StandardOpenOption;
import java.time.Instant;

public class BackupManager {

    private static final ObjectMapper objectMapper = new ObjectMapper();
    private static final Path backupDir = Paths.get(new File("").toURI()).resolve("src/main/resources/backup");

    public static void doBackup(ConnectionDTO connection, String fromVersion, String toVersion) {
        doBackup(connection, fromVersion, toVersion, "connection");
    }

    public static void doBackup(Template template, String fromVersion, String toVersion) {
        doBackup(template, fromVersion, toVersion, "template");
    }

    private static <T> void doBackup(T entity, String fromVersion, String toVersion, String entityType) {
        try {
            BackupEntity backup = new BackupEntity();
            backup.setTimestamp(Instant.now().toEpochMilli());
            backup.setFromVersion(fromVersion);
            backup.setToVersion(toVersion);
            backup.setEntityClass(entity.getClass().getName());
            backup.setData(entity);

            Path entityBackupDir = backupDir.resolve(entityType);
            Files.createDirectories(entityBackupDir); // No need to check existence; `createDirectories` does it safely

            String fileName = String.format("%d.json", backup.getTimestamp());
            Path filePath = entityBackupDir.resolve(fileName);

            try (BufferedWriter writer = Files.newBufferedWriter(filePath, StandardOpenOption.CREATE)) {
                objectMapper.writeValue(writer, backup);
            }
        } catch (IOException ignored) {
        }
    }

}
