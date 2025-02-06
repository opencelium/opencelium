package com.becon.opencelium.backend.version_manager.backup;

import com.fasterxml.jackson.core.JsonProcessingException;
import com.fasterxml.jackson.databind.ObjectMapper;
import org.springframework.stereotype.Component;

import java.io.BufferedWriter;
import java.io.File;
import java.io.IOException;
import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.Paths;
import java.nio.file.StandardOpenOption;
import java.time.Instant;

@Component
public class BackupManager {

    private final ObjectMapper objectMapper;
    private final Path backupDir = Paths.get(new File("").toURI()).resolve("src/main/resources/updating-backup");

    public BackupManager(ObjectMapper objectMapper) {
        this.objectMapper = objectMapper;
    }

    public void doBackup(Object data, String fromVersion, String toVersion) {
        try {
            doBackup(objectMapper.writeValueAsString(data), data.getClass(),  fromVersion, toVersion);
        } catch (JsonProcessingException ignored) {
        }
    }

    public void doBackup(Object obj, Class<?> clazz, String fromVersion, String toVersion) {
        try {
            BackupEntity backup = new BackupEntity();
            backup.setTimestamp(Instant.now().toEpochMilli());
            backup.setFromVersion(fromVersion);
            backup.setToVersion(toVersion);
            backup.setEntityClass(clazz.getName());
            backup.setData(obj);

            String entityClassName = clazz.getSimpleName();
            Path entityBackupDir = backupDir.resolve(entityClassName);
            if (!Files.exists(entityBackupDir)) {
                Files.createDirectories(entityBackupDir);
            }

            String fileName = String.format("%d.json", backup.getTimestamp());
            Path filePath = entityBackupDir.resolve(fileName);

            try (BufferedWriter writer = Files.newBufferedWriter(filePath, StandardOpenOption.CREATE)) {
                objectMapper.writeValue(writer, backup);
            }
        } catch (IOException ignored) {
        }
    }
}
