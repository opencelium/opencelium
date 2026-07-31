package com.becon.opencelium.backend.execution.logger.pubsub.handler;

import com.becon.opencelium.backend.constant.AppYamlPath;
import com.becon.opencelium.backend.database.mysql.service.ConnectionService;
import com.becon.opencelium.backend.database.mysql.service.SchedulerService;
import com.becon.opencelium.backend.execution.logger.pubsub.Execution2MetadataMapping;
import com.becon.opencelium.backend.execution.logger.pubsub.event.ExecutionEvent;
import com.becon.opencelium.backend.execution.logger.pubsub.event.ExecutionFinishedEvent;
import com.becon.opencelium.backend.execution.logger.pubsub.event.ExecutionStartedEvent;
import com.becon.opencelium.backend.execution.logger.service.LogDataService;
import com.becon.opencelium.backend.execution.socket.Connection2WebSocketChannelMapping;
import com.becon.opencelium.backend.execution.supportfile.SupportFileService;
import com.becon.opencelium.backend.utility.LogFileUtility;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.core.env.Environment;
import org.springframework.stereotype.Component;

import java.io.IOException;
import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.StandardCopyOption;

import static com.becon.opencelium.backend.constant.LogConstant.FAIL;
import static com.becon.opencelium.backend.constant.LogConstant.LOG_FILE_EXTENSION;
import static com.becon.opencelium.backend.constant.LogConstant.LOG_LOCATION;
import static com.becon.opencelium.backend.constant.LogConstant.SUCCESS;
import static com.becon.opencelium.backend.quartz.QuartzJobScheduler.TriggerType.EXECUTION_TEST;
import static com.becon.opencelium.backend.quartz.QuartzJobScheduler.TriggerType.SUPPORT_FILE;
import static com.becon.opencelium.backend.utility.LogFileUtility.buildUncategorizedLogFilePath;

@Component
public class ExecutionLifecycleEventHandler implements ExecutionEventHandler {
    private final SchedulerService schedulerService;
    private final SupportFileService supportFileService;
    private final ConnectionService connectionService;
    private final Connection2WebSocketChannelMapping connection2ChannelMapping;
    private final Execution2MetadataMapping metadata;
    private final LogDataService logDataService;
    private final Environment env;
    private static final Logger logger = LoggerFactory.getLogger(ExecutionLifecycleEventHandler.class);

    public ExecutionLifecycleEventHandler(
            SchedulerService schedulerService,
            SupportFileService supportFileService,
            ConnectionService connectionService,
            Connection2WebSocketChannelMapping connection2ChannelMapping,
            Execution2MetadataMapping metadata,
            LogDataService logDataService,
            Environment env
    ) {
        this.schedulerService = schedulerService;
        this.supportFileService = supportFileService;
        this.connectionService = connectionService;
        this.connection2ChannelMapping = connection2ChannelMapping;
        this.metadata = metadata;
        this.logDataService = logDataService;
        this.env = env;
    }

    @Override
    public boolean supports(ExecutionEvent event) {
        return event instanceof ExecutionStartedEvent || event instanceof ExecutionFinishedEvent;
    }

    @Override
    public void handle(ExecutionEvent event) {
        if (event instanceof ExecutionStartedEvent e) {
            metadata.create(e.executionId(), e.connectionId(), e.schedulerId(), e.timestamp());
        } else if (event instanceof ExecutionFinishedEvent e) {
            try {
                handleFinish(e);
            } finally {
                // the mapping entry and its open file channel must be released even
                // when finish handling fails, otherwise they leak until restart
                metadata.remove(e.executionId());
            }
        }
    }


    private void handleFinish(ExecutionFinishedEvent event) {
        long executionId = event.executionId();
        if (!metadata.exists(executionId)) {
            logger.warn("Skipping finish handling for unknown executionId = {}", executionId);
            return;
        }

        long connectionId = metadata.getConnectionId(executionId);
        int schedulerId = metadata.getSchedulerId(executionId);
        String timestamp = metadata.getTimestamp(executionId);
        String result = event.result();

        boolean logExists = hasLogFile(executionId, connectionId, timestamp) && hasDbRecords(executionId);

        if (EXECUTION_TEST == event.type()) {
            // temporary test artifacts are removed unconditionally — leaving them behind
            // because the log is missing would leak the connection, scheduler and mapping
            runQuietly(() -> schedulerService.deleteById(schedulerId), "delete test scheduler " + schedulerId);
            runQuietly(() -> connectionService.deleteById(connectionId), "delete test connection " + connectionId);
            connection2ChannelMapping.remove(connectionId);

            if (logExists) {
                moveLogFile(connectionId, executionId, timestamp, result);
            }
        } else if (SUPPORT_FILE == event.type()) {
            runQuietly(() -> schedulerService.deleteById(schedulerId), "delete support-file scheduler " + schedulerId);

            if (logExists) {
                supportFileService.collectFiles(connectionId, executionId, timestamp, result);
            }
        } else if (logExists) {
            moveLogFile(connectionId, executionId, timestamp, result);
        }
    }

    private void runQuietly(Runnable action, String description) {
        try {
            action.run();
        } catch (RuntimeException e) {
            logger.warn("Failed to {}", description, e);
        }
    }

    private boolean hasLogFile(long executionId, long connectionId, String timestamp) {
        Path logFilePath = buildUncategorizedLogFilePath(timestamp, connectionId, executionId);
        return Files.isRegularFile(logFilePath);
    }

    private boolean hasDbRecords(long executionId) {
        return logDataService.findRootByExecutionId(executionId).isPresent();
    }

    public void moveLogFile(Long connectionId, long executionId, String timestamp, String result) {
        Path sourcePath = buildUncategorizedLogFilePath(timestamp, connectionId, executionId);
        Path destinationPath = LogFileUtility.toPath(LOG_LOCATION, connectionId.toString(), LogFileUtility.toFilename(timestamp, connectionId, result, executionId, LOG_FILE_EXTENSION));

        try {
            Files.createDirectories(destinationPath.getParent());

            Files.move(sourcePath, destinationPath, StandardCopyOption.REPLACE_EXISTING);
        } catch (IOException e) {
            logger.warn(e.getMessage());
        } finally {
            int fileLimit = getFileLimit(result);
            LogFileUtility.enforceLimit(LOG_LOCATION, connectionId, result, fileLimit);
        }
    }

    private int getFileLimit(String result) {
        int limit = 1;
        if (SUCCESS.equals(result)) {
            limit = env.getProperty(AppYamlPath.LOG_FILE_SUCCESS_LIMIT, Integer.class, 2);
        } else if (FAIL.equals(result)) {
            limit = env.getProperty(AppYamlPath.LOG_FILE_FAIL_LIMIT, Integer.class, 3);
        }

        return limit;
    }
}
