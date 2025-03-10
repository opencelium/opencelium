package com.becon.opencelium.backend.version_manager.backup;

import com.becon.opencelium.backend.database.mysql.service.EnhancementService;
import org.springframework.boot.autoconfigure.jdbc.DataSourceProperties;
import org.springframework.stereotype.Service;

import java.io.File;
import java.io.IOException;
import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.Paths;

@Service
public class MysqlBackupService {

    private static final String TABLE_NAME = "enhancements";

    private final DataSourceProperties dbProperties;
    private final EnhancementService enhancementService;

    public MysqlBackupService(DataSourceProperties dbProperties, EnhancementService enhancementService) {
        this.dbProperties = dbProperties;
        this.enhancementService = enhancementService;
    }

    /**
     * Backs up the 'enhancements' table using mysqldump.
     */
    public void backup() {
        ProcessBuilder processBuilder = new ProcessBuilder(
                "mysqldump",
                "-h", extractHost(dbProperties.determineUrl()),     // Extract host
                "-P", extractPort(dbProperties.determineUrl()),     // Extract port
                "-u", dbProperties.determineUsername(),
                "--password=" + dbProperties.determinePassword(),   // Use --password=
                "--databases", dbProperties.determineDatabaseName(),
                "--tables", TABLE_NAME
        );

        Path root = Paths.get(new File("").toURI());
        File backupFile = new File(root.resolve("src/main/resources/backup/enhancements_backup.sql").toString());
        processBuilder.redirectOutput(backupFile);
        if (!backupFile.exists()) {
            backupFile.getParentFile().mkdirs();
            try {
                backupFile.createNewFile();
            } catch (IOException e) {
                throw new RuntimeException(e);
            }
        }

        try {
            Process process = processBuilder.start();
            int exitCode = process.waitFor();
            if (exitCode == 0) {
                System.out.println("Backup complete");
            } else {
                throw new RuntimeException("Could not create backup file");
            }
        } catch (IOException | InterruptedException e) {
            throw new RuntimeException("Error executing backup", e);
        }
    }

    private String extractHost(String url) {
        // Example: jdbc:mysql://localhost:3306/opencelium
        return url.replaceFirst("jdbc:mysql://", "").split(":|/")[0];
    }

    private String extractPort(String url) {
        // Extract port number
        String[] parts = url.replaceFirst("jdbc:mysql://", "").split(":|/");
        return (parts.length > 1 && parts[1].matches("\\d+")) ? parts[1] : "3306"; // Default to 3306
    }

    /**
     * Restores the 'enhancements' table using mysql.
     */
    public void restore() {
        ProcessBuilder processBuilder = new ProcessBuilder(
                "mysql",
                "-h", extractHost(dbProperties.determineUrl()),     // Extract host
                "-P", extractPort(dbProperties.determineUrl()),     // Extract port
                "-u", dbProperties.determineUsername(),
                "--password=" + dbProperties.determinePassword(),   // Use --password=
                dbProperties.determineDatabaseName()                // Database name
        );


        Path root = Paths.get(new File("").toURI());
        File backupFile = new File(root.resolve("src/main/resources/backup/enhancements_backup.sql").toString());
        processBuilder.redirectInput(backupFile);

        enhancementService.deleteAll();
        try {
            Process process = processBuilder.start();
            int exitCode = process.waitFor();
            if (exitCode == 0) {
                System.out.println("Restore succeed");
                Files.deleteIfExists(Path.of(backupFile.getPath()));
            } else {
                throw new RuntimeException("Could not restore backup file");
            }
        } catch (IOException | InterruptedException e) {
            throw new RuntimeException("Error executing restore", e);
        }
    }
}
