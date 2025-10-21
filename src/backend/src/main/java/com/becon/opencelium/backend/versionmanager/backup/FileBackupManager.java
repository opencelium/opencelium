package com.becon.opencelium.backend.versionmanager.backup;

import com.becon.opencelium.backend.constant.PathConstant;
import com.becon.opencelium.backend.template.entity.Template;
import com.fasterxml.jackson.databind.ObjectMapper;
import org.springframework.util.FileSystemUtils;

import java.io.BufferedWriter;
import java.io.File;
import java.io.IOException;
import java.nio.file.*;
import java.nio.file.attribute.BasicFileAttributes;
import java.time.Instant;
import java.time.LocalDate;
import java.time.format.DateTimeFormatter;

public class FileBackupManager {

    private static final ObjectMapper objectMapper = new ObjectMapper();
    private static final Path backupDir = Paths.get(PathConstant.BACKUP);

    public static void doBackup(Template template, String fromVersion, String toVersion) {
        doBackup(template, fromVersion, toVersion, "template", template.getTemplateId());
    }

    public static boolean isPresent(String entity, String fromVersion, String id) {
        File[] matchingFiles = backupDir.resolve(entity).toFile().listFiles((dir, name) ->
                isThisVersion(name, entity, fromVersion, id)
        );
        return matchingFiles != null && matchingFiles.length > 0;
    }

    private static boolean isThisVersion(String name, String entity, String fromVersion, String id) {
        return name.startsWith(entity + "_v" + fromVersion + "_")
                && name.endsWith(id + ".json");
    }

    private static <T> void doBackup(T entity, String fromVersion, String toVersion, String entityType, String id) {
        try {
            fromVersion = fromVersion.replaceAll("[^\\d.]", "");

            BackupEntity backup = new BackupEntity();
            backup.setTimestamp(Instant.now().toEpochMilli());
            backup.setFromVersion(fromVersion);
            backup.setToVersion(toVersion);
            backup.setEntityClass(entity.getClass().getName());
            backup.setData(entity);

            Path entityBackupDir = backupDir.resolve(entityType);
            Files.createDirectories(entityBackupDir); // No need to check existence; `createDirectories` does it safely

            if (isPresent(entityType, fromVersion, id)) {
                return;
            }

            String fileName = String.format(
                    "%s_v%s_%s_%s.json",
                    entityType,
                    fromVersion.replace('.', '_'),
                    LocalDate.now().format(DateTimeFormatter.ofPattern("yyyy_MM_dd")),
                    id
            );
            Path filePath = entityBackupDir.resolve(fileName);

            try (BufferedWriter writer = Files.newBufferedWriter(filePath, StandardOpenOption.CREATE)) {
                objectMapper.writeValue(writer, backup);
            }
        } catch (IOException ignored) {
        }
    }

    public static void moveToNewLocation(String oldPath, String newPath) {
        Path sourceDir = Paths.get(oldPath);
        Path targetDir = Paths.get(newPath);

        if (!Files.exists(sourceDir)) {
            return;
        }

        if (!Files.exists(targetDir)) {
            targetDir.toFile().mkdirs();
        }

        try {
            FileSystemUtils.copyRecursively(sourceDir, targetDir);
            FileSystemUtils.deleteRecursively(sourceDir);
        } catch (IOException e) {
            throw new RuntimeException(e);
        }

    }

}
