package com.becon.opencelium.backend.scheduler;

import com.becon.opencelium.backend.constant.props.LogProperties;
import com.becon.opencelium.backend.constant.props.SupportFileProperties;
import com.becon.opencelium.backend.database.mysql.entity.Connection;
import com.becon.opencelium.backend.database.mysql.entity.Execution;
import com.becon.opencelium.backend.database.mysql.service.ConnectionService;
import com.becon.opencelium.backend.database.mysql.service.ExecutionService;
import com.becon.opencelium.backend.execution.logger.service.LogDataService;
import com.becon.opencelium.backend.utility.LogFileUtility;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Qualifier;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Component;

import java.io.IOException;
import java.nio.file.Files;
import java.nio.file.Path;
import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.HashMap;
import java.util.HashSet;
import java.util.List;
import java.util.Map;
import java.util.Set;
import java.util.stream.Stream;

import static com.becon.opencelium.backend.utility.LogFileUtility.extractTime;
import static com.becon.opencelium.backend.utility.LogFileUtility.toPath;

@Component
public class ConnectionLogSweeper {

    private static final Logger logger = LoggerFactory.getLogger(ConnectionLogSweeper.class);

    private final ConnectionService connectionService;
    private final ExecutionService executionService;
    private final LogDataService logDataService;
    private final LogProperties logProperties;
    private final SupportFileProperties supportFileProperties;

    public ConnectionLogSweeper(
            @Qualifier("connectionServiceImp") ConnectionService connectionService,
            ExecutionService executionService,
            LogDataService logDataService,
            LogProperties logProperties,
            SupportFileProperties supportFileProperties
    ) {
        this.connectionService = connectionService;
        this.executionService = executionService;
        this.logDataService = logDataService;
        this.logProperties = logProperties;
        this.supportFileProperties = supportFileProperties;
    }

    @Scheduled(
            fixedDelayString = "${opencelium.log.retention.test-connection.sweep-interval:10000}",
            initialDelayString = "${opencelium.log.retention.test-connection.initial-delay:10000}"
    )
    public void sweep() {
        if (!logProperties.getRetention().getTestConnection().isEnabled()) {
            return;
        }

        // Phase 1
        removeLogFiles();

        // Phase 2
        removeLogDataForDeletedFiles();
    }


    private void removeLogFiles() {
        Map<Long, List<Path>> pathsByConnectionId = collectConnectionArtifactPaths();
        if (pathsByConnectionId.isEmpty()) {
            return;
        }

        Set<Long> existingConnectionIds = findPersistedConnectionIds();
        LocalDateTime expirationThreshold = LocalDateTime.now()
                .minus(logProperties.getRetention().getTestConnection().getMaxAge());

        pathsByConnectionId.forEach((connectionId, paths) -> {
            if (existingConnectionIds.contains(connectionId)) {
                return;
            }

            paths.forEach(path -> deleteFileIfExpired(connectionId, path, expirationThreshold));
        });
    }

    private void removeLogDataForDeletedFiles() {
        List<Long> allExecutions = executionService.findAll().stream()
                .map(Execution::getId)
                .toList();

        List<Long> executionsWithLogFile = collectConnectionArtifactPaths().values()
                .stream()
                .flatMap(List::stream)
                .filter(path -> !Files.exists(path))
                .map(LogFileUtility::extractExecutionId)
                .toList();

        allExecutions.stream()
                .filter(executionId -> !executionsWithLogFile.contains(executionId))
                .forEach(executionId -> {
                    logDataService.deleteAllByExecutionId(executionId.toString());

                    logger.info(
                            "Deleted orphan log_data for execution {}",
                            executionId
                    );
                });
    }

    private Map<Long, List<Path>> collectConnectionArtifactPaths() {
        Map<Long, List<Path>> result = new HashMap<>();

        collectArtifactFilesFromRoot(toPath(logProperties.getLocation()), ".log", result);

        collectArtifactFilesFromRoot(toPath(supportFileProperties.getDirectory()), ".zip", result);

        return result;
    }

    private void collectArtifactFilesFromRoot(Path root, String extension, Map<Long, List<Path>> result) {
        if (!Files.isDirectory(root)) {
            return;
        }

        try (Stream<Path> directories = Files.list(root)) {
            directories
                    .filter(Files::isDirectory)
                    .filter(path -> isUnsignedLong(path.getFileName().toString()))
                    .forEach(directory -> collectArtifactFilesFromDirectory(directory, extension, result));
        } catch (IOException e) {
            logger.warn("Failed to scan connection artifact root '{}'", root, e);
        }
    }

    private void collectArtifactFilesFromDirectory(Path connectionDirectory, String extension, Map<Long, List<Path>> result) {
        long connectionId = Long.parseLong(connectionDirectory.getFileName().toString());

        try (Stream<Path> files = Files.list(connectionDirectory)) {
            List<Path> artifactFiles = files
                    .filter(Files::isRegularFile)
                    .filter(path -> path.getFileName().toString().endsWith(extension))
                    .filter(path -> !extractTime(path).equals(LocalDateTime.MIN))
                    .toList();

            if (!artifactFiles.isEmpty()) {
                result.computeIfAbsent(connectionId, ignored -> new ArrayList<>()).addAll(artifactFiles);
            }
        } catch (IOException e) {
            logger.warn("Failed to scan connection artifact directory '{}'", connectionDirectory, e);
        }
    }

    private Set<Long> findPersistedConnectionIds() {
        Set<Long> result = new HashSet<>();
        for (Connection connection : connectionService.findAll()) {
            result.add(connection.getId());
        }
        return result;
    }

    private boolean isUnsignedLong(String value) {
        if (value == null || value.isBlank()) {
            return false;
        }

        try {
            return Long.parseLong(value) >= 0;
        } catch (NumberFormatException e) {
            return false;
        }
    }

    private void deleteFileIfExpired(long connectionId, Path path, LocalDateTime expirationThreshold) {
        LocalDateTime artifactTime = extractTime(path);
        if (artifactTime.equals(LocalDateTime.MIN) || !artifactTime.isBefore(expirationThreshold)) {
            return;
        }

        try {
            if (!Files.deleteIfExists(path)) {
                return;
            }

            logger.info("Deleted expired artifact '{}' for missing connection {}", path, connectionId);
            deleteDirectoryIfEmpty(path.getParent());
        } catch (IOException e) {
            logger.warn("Failed to delete expired artifact '{}' for missing connection {}", path, connectionId, e);
        }
    }

    private void deleteDirectoryIfEmpty(Path directory) {
        try (Stream<Path> children = Files.list(directory)) {
            if (children.findAny().isPresent()) {
                return;
            }
        } catch (IOException e) {
            logger.warn("Failed to inspect artifact directory '{}'", directory, e);
            return;
        }

        try {
            Files.deleteIfExists(directory);
        } catch (IOException e) {
            logger.warn("Failed to delete empty artifact directory '{}'", directory, e);
        }
    }
}
