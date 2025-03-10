package com.becon.opencelium.backend.version_manager.backup;

import com.becon.opencelium.backend.configuration.OpenCeliumProps;
import com.becon.opencelium.backend.database.mysql.service.EnhancementService;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.boot.autoconfigure.jdbc.DataSourceProperties;
import org.springframework.stereotype.Service;

import java.io.File;
import java.io.IOException;
import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.Paths;
import java.sql.*;
import java.time.LocalDate;
import java.time.format.DateTimeFormatter;
import java.util.Arrays;
import java.util.List;
import java.util.Objects;
import java.util.regex.Matcher;
import java.util.regex.Pattern;

@Service
public class MysqlBackupService {

    private static final String ROOT_FOLDER = "/src/main/resources/backup";
    private static final Logger log = LoggerFactory.getLogger(MysqlBackupService.class);

    private final OpenCeliumProps ocProps;
    private final DataSourceProperties dbProperties;
    private final EnhancementService enhancementService;

    public MysqlBackupService(OpenCeliumProps ocProps, DataSourceProperties dbProperties, EnhancementService enhancementService) {
        this.ocProps = ocProps;
        this.dbProperties = dbProperties;
        this.enhancementService = enhancementService;
    }

    public void backup(String entity) {
        List<String> command = Arrays.asList(
                "mysqldump",
                "-h", extractHost(dbProperties.determineUrl()),
                "-P", extractPort(dbProperties.determineUrl()),
                "-u", dbProperties.determineUsername(),
                "--password=" + dbProperties.determinePassword(),
                "--databases", extractSchemaName(dbProperties.determineUrl()),
                "--tables", entity
        );

        ProcessBuilder processBuilder = new ProcessBuilder(command);

        File existingMatchedFile = getBackupWithCurrentVersionIfPresent(entity);
        if (Objects.nonNull(existingMatchedFile)) {
            try {
                Files.deleteIfExists(Path.of(existingMatchedFile.getAbsolutePath()));
            } catch (IOException ignored) {
            }
        }

        File backupFile = new File(Paths.get(new File("").toURI()).resolve(buildFilePath(entity)).toString());
        if (!backupFile.exists()) {
            backupFile.getParentFile().mkdirs();
            try {
                backupFile.createNewFile();
            } catch (IOException e) {
                throw new RuntimeException(e);
            }
        }

        processBuilder.redirectOutput(backupFile);

        try {
            Process process = processBuilder.start();
            int exitCode = process.waitFor();
            if (exitCode != 0 && exitCode != 2) {
                throw new RuntimeException("Could not create backup file");
            }
        } catch (IOException | InterruptedException e) {
            throw new RuntimeException("Error executing backup", e);
        } finally {
            killActiveConnection();
        }
    }

    private File getBackupWithCurrentVersionIfPresent(String entity) {
        File[] matchingFiles = new File(ROOT_FOLDER + "/" + entity).listFiles((dir, name) ->
                isThisVersion(name)
        );
        return (matchingFiles != null && matchingFiles.length > 0) ? matchingFiles[0] : null;
    }

    public void restore(String entity) {
        List<String> command = Arrays.asList(
                "mysql",
                "-h", extractHost(dbProperties.determineUrl()),
                "-P", extractPort(dbProperties.determineUrl()),
                "-u", dbProperties.determineUsername(),
                "--password=" + dbProperties.determinePassword(),
                extractSchemaName(dbProperties.determineUrl())
        );
        ProcessBuilder processBuilder = new ProcessBuilder(command);

        File backupFile = getBackupWithCurrentVersionIfPresent(entity);
        if (Objects.isNull(backupFile)) {
            throw new RuntimeException("Backup file not found");
        }

        processBuilder.redirectInput(backupFile);

        enhancementService.deleteAll();
        try {
            Process process = processBuilder.start();
            int exitCode = process.waitFor();
            if (exitCode == 0 || exitCode == 2) {
                System.out.println("Restore succeed");
                Files.deleteIfExists(Path.of(backupFile.getAbsolutePath()));
            } else {
                throw new RuntimeException("Could not restore backup file");
            }
        } catch (IOException | InterruptedException e) {
            throw new RuntimeException("Error executing restore", e);
        } finally {
            killActiveConnection();
        }
    }

    private String buildFilePath(String entityName) {
        return ROOT_FOLDER + "/" +
               entityName +
               "_backup_v" +
               ocProps.getVersion().replace('.', '_') + "_" +
               LocalDate.now().format(DateTimeFormatter.ofPattern("yyyy_MM_dd")) +
               ".sql";
    }

    private boolean isThisVersion(String name) {
        return name.startsWith(name + "_backup_v" + ocProps.getVersion().replace('.', '_') + "_")
               && name.endsWith(".sql");
    }

    private String extractHost(String url) {
        String regex = "jdbc:(mysql|mariadb)://([^:/]+)";
        Pattern pattern = Pattern.compile(regex);
        Matcher matcher = pattern.matcher(url);
        if (matcher.find()) {
            return matcher.group(2);  // Capture the hostname
        }
        throw new IllegalStateException("Invalid JDBC URL: " + url);
    }

    private String extractPort(String url) {
        String regex = "jdbc:(mysql|mariadb)://[^:/]+:(\\d+)";
        Pattern pattern = Pattern.compile(regex);
        Matcher matcher = pattern.matcher(url);
        if (matcher.find()) {
            return matcher.group(2);
        }
        return "3306"; // Default port
    }

    private String extractSchemaName(String url) {
        String regex = "jdbc:(mysql|mariadb)://[^:/]+:\\d+/([^?]+)";
        Pattern pattern = Pattern.compile(regex);
        Matcher matcher = pattern.matcher(url);
        if (matcher.find()) {
            return matcher.group(2);  // Capture the schema name
        }
        throw new IllegalStateException("Invalid JDBC URL: " + url);
    }

    private void killActiveConnection() {
        try (Connection connection = DriverManager.getConnection(
                dbProperties.determineUrl(),
                dbProperties.determineUsername(),
                dbProperties.determinePassword()
        );
             Statement statement = connection.createStatement();
             ResultSet resultSet = statement.executeQuery("SELECT CONNECTION_ID()")) {

            if (resultSet.next()) {
                int connectionId = resultSet.getInt(1);
                statement.execute("KILL " + connectionId);
            }
        } catch (SQLException e) {
            log.error("Error killing a connection to mysql");
        }
    }


}
