package com.becon.opencelium.backend.execution.logger.pubsub.handler;

import com.becon.opencelium.backend.constant.ConnectionConstants;
import com.becon.opencelium.backend.constant.props.LogProperties;
import com.becon.opencelium.backend.constant.props.SupportFileProperties;
import com.becon.opencelium.backend.database.mysql.entity.Connector;
import com.becon.opencelium.backend.database.mysql.service.ConnectionService;
import com.becon.opencelium.backend.database.mysql.service.ConnectorService;
import com.becon.opencelium.backend.database.mysql.service.SchedulerService;
import com.becon.opencelium.backend.enums.SupportFileStatus;
import com.becon.opencelium.backend.execution.logger.pubsub.Execution2MetadataMapping;
import com.becon.opencelium.backend.execution.logger.pubsub.event.ExecutionEvent;
import com.becon.opencelium.backend.execution.logger.pubsub.event.ExecutionFinishedEvent;
import com.becon.opencelium.backend.execution.logger.pubsub.event.ExecutionStartedEvent;
import com.becon.opencelium.backend.execution.logger.service.LogDataService;
import com.becon.opencelium.backend.execution.supportfile.SupportFile;
import com.becon.opencelium.backend.invoker.service.InvokerService;
import com.becon.opencelium.backend.resource.connection.ConnectionDTO;
import com.becon.opencelium.backend.resource.template.TemplateResource;
import com.becon.opencelium.backend.template.service.TemplateService;
import com.becon.opencelium.backend.websocket.Connection2WebSocketChannelMapping;
import com.becon.opencelium.backend.websocket.WebSocketNotificationService;
import com.becon.opencelium.backend.websocket.constant.SocketConstant;
import com.fasterxml.jackson.databind.ObjectMapper;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.stereotype.Component;

import java.io.File;
import java.io.FileInputStream;
import java.io.FileOutputStream;
import java.io.IOException;
import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.StandardCopyOption;
import java.time.LocalDateTime;
import java.util.List;
import java.util.Objects;
import java.util.stream.Stream;
import java.util.zip.ZipEntry;
import java.util.zip.ZipOutputStream;

import static com.becon.opencelium.backend.constant.LogConstant.FAIL;
import static com.becon.opencelium.backend.constant.LogConstant.LOG_FILE_EXTENSION;
import static com.becon.opencelium.backend.constant.LogConstant.LOG_LOCATION;
import static com.becon.opencelium.backend.constant.LogConstant.NAME_PARTS_SEPARATOR;
import static com.becon.opencelium.backend.constant.LogConstant.SUCCESS;
import static com.becon.opencelium.backend.constant.LogConstant.UNCATEGORIZED;
import static com.becon.opencelium.backend.quartz.QuartzJobScheduler.TriggerType.EXECUTION_TEST;
import static com.becon.opencelium.backend.quartz.QuartzJobScheduler.TriggerType.SUPPORT_FILE;
import static com.becon.opencelium.backend.utility.LogFileUtility.buildUncategorizedLogFilePath;
import static com.becon.opencelium.backend.utility.LogFileUtility.delete;
import static com.becon.opencelium.backend.utility.LogFileUtility.extractTime;
import static com.becon.opencelium.backend.utility.LogFileUtility.toFilename;
import static com.becon.opencelium.backend.utility.LogFileUtility.toPath;

@Component
public class ExecutionLifecycleEventHandler implements ExecutionEventHandler {
    private final SchedulerService schedulerService;
    private final ConnectionService connectionService;
    private final Connection2WebSocketChannelMapping connection2ChannelMapping;
    private final Execution2MetadataMapping metadata;
    private final LogDataService logDataService;
    private final TemplateService templateService;
    private final ConnectorService connectorService;
    private final InvokerService invokerService;
    private final WebSocketNotificationService notificationService;

    private final int logFileSuccessLimit;
    private final int logFileFailLimit;
    private final String supportFileBaseFolder;
    private final int supportFileSuccessLimit;
    private final int supportFileFailLimit;

    private static final Logger logger = LoggerFactory.getLogger(ExecutionLifecycleEventHandler.class);

    public ExecutionLifecycleEventHandler(
            SchedulerService schedulerService,
            ConnectionService connectionService,
            Connection2WebSocketChannelMapping connection2ChannelMapping,
            Execution2MetadataMapping metadata,
            LogDataService logDataService,
            TemplateService templateService,
            ConnectorService connectorService,
            InvokerService invokerService,
            WebSocketNotificationService notificationService,
            LogProperties logProperties,
            SupportFileProperties supportFileProperties
    ) {
        this.schedulerService = schedulerService;
        this.connectionService = connectionService;
        this.connection2ChannelMapping = connection2ChannelMapping;
        this.metadata = metadata;
        this.logDataService = logDataService;
        this.templateService = templateService;
        this.connectorService = connectorService;
        this.invokerService = invokerService;
        this.notificationService = notificationService;

        this.logFileSuccessLimit = logProperties.getRetention().getPerConnection().getSuccess();
        this.logFileFailLimit = logProperties.getRetention().getPerConnection().getFail();
        this.supportFileBaseFolder = supportFileProperties.getDirectory();
        this.supportFileSuccessLimit = supportFileProperties.getLimit().getSuccess();
        this.supportFileFailLimit = supportFileProperties.getLimit().getFail();
    }

    @Override
    public boolean supports(ExecutionEvent event) {
        return event instanceof ExecutionStartedEvent || event instanceof ExecutionFinishedEvent;
    }

    @Override
    public void handle(ExecutionEvent event) {
        if (event instanceof ExecutionStartedEvent e) {
            metadata.create(e.executionId(), e.connectionId(), e.schedulerId(), e.timestamp());
            return;
        }

        if (event instanceof ExecutionFinishedEvent e) {
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

        boolean logExists = hasLogFile(executionId, connectionId, timestamp) && logDataService.hasDbRecords(executionId);

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
                collectSupportFile(connectionId, executionId, timestamp, result);
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

    private void moveLogFile(Long connectionId, long executionId, String timestamp, String result) {
        Path sourcePath = buildUncategorizedLogFilePath(timestamp, connectionId, executionId);
        Path destinationPath = toPath(LOG_LOCATION, connectionId.toString(), toFilename(timestamp, connectionId, result, executionId, LOG_FILE_EXTENSION));

        try {
            Files.createDirectories(destinationPath.getParent());

            Files.move(sourcePath, destinationPath, StandardCopyOption.REPLACE_EXISTING);
        } catch (IOException e) {
            logger.warn(e.getMessage());
        } finally {
            int fileLimit = SUCCESS.equals(result) ? logFileSuccessLimit : FAIL.equals(result) ? logFileFailLimit : 1;
            enforceLimit(LOG_LOCATION, connectionId, result, fileLimit);
        }
    }

    private void collectSupportFile(Long connectionId, long executionId, String timestamp, String type) {
        // create temporary file collection directory:
        String zipFilename = toFilename(timestamp, connectionId, type, executionId, "zip");
        Path zipFilePath = toPath(supportFileBaseFolder, connectionId.toString(), zipFilename);

        // create parent directories if not exists:
        try {
            Files.createDirectories(zipFilePath.getParent());
        } catch (IOException e) {
            logger.error("Failed to create support file directory connectionId = '{}'", connectionId);
            throw new RuntimeException(e);
        }

        String connectionTitle = null;
        try (
                FileOutputStream fos = new FileOutputStream(zipFilePath.toFile());
                ZipOutputStream zipOutputStream = new ZipOutputStream(fos)
        ) {
            ConnectionDTO dto = connectionService.getFullConnection(connectionId);

            // Add Connection resource template as a JSON file:
            TemplateResource template = templateService.getByConnectionId(connectionId);
            connectionTitle = template.getName(); // Connection.title == Template.name
            addToZip(zipOutputStream, template, "connection_template.json");

            // Add invoker files:
            Integer fromConnectorId = dto.getFromConnector().getConnectorId();
            if (!Objects.equals(fromConnectorId, ConnectionConstants.DEFAULT_CONNECTOR_ID)) {
                Connector fromConnector = connectorService.getById(fromConnectorId);
                File fromInvoker = invokerService.findFileByInvokerName(fromConnector.getInvoker());
                addToZip(zipOutputStream, fromInvoker, fromConnector.getInvoker() + ".xml");
            }

            if (dto.getToConnector() != null) {
                int toConnectorId = dto.getToConnector().getConnectorId();
                if (fromConnectorId != toConnectorId) {
                    Connector toConnector = connectorService.getById(toConnectorId);
                    File toInvoker = invokerService.findFileByInvokerName(toConnector.getInvoker());
                    addToZip(zipOutputStream, toInvoker, toConnector.getInvoker() + ".xml");
                }
            }

            // copy temporary uncategorized log file into zip, then delete it:
            Path filePath = toPath(LOG_LOCATION, toFilename(timestamp, connectionId, UNCATEGORIZED, executionId, LOG_FILE_EXTENSION));
            addToZip(zipOutputStream, filePath.toFile(), toFilename(timestamp, connectionId, type, executionId, LOG_FILE_EXTENSION));
            delete(filePath);

            // send success notification vie websocket
            String filename = toFilename(timestamp, connectionId, type, executionId, "zip");
            String message = "Support file successfully generated.";
            SupportFile notification = new SupportFile(connectionId, connectionTitle, filename, SupportFileStatus.SUPPORT_FILE_GENERATED, message);
            notificationService.send(SocketConstant.SUPPORT_FILE_DESTINATION, notification);
        } catch (Exception e) {
            // send fail notification vie websocket
            String message = "Support file generation failed: " + e.getMessage();
            SupportFile notification = new SupportFile(connectionId, connectionTitle, null, SupportFileStatus.SUPPORT_FILE_FAILED, message);
            notificationService.send(SocketConstant.SUPPORT_FILE_DESTINATION, notification);

            logger.error("Failed to create support file for connectionId = '{}'", connectionId);
        } finally {
            int fileLimit = SUCCESS.equals(type) ? supportFileSuccessLimit : supportFileFailLimit;
            enforceLimit(supportFileBaseFolder, connectionId, type, fileLimit);
        }
    }

    private void addToZip(ZipOutputStream zipOutputStream, Object object, String zipEntryName) throws IOException {
        ObjectMapper objectMapper = new ObjectMapper();
        byte[] jsonBytes = objectMapper.writeValueAsBytes(object);

        ZipEntry zipEntry = new ZipEntry(zipEntryName);
        zipOutputStream.putNextEntry(zipEntry);
        zipOutputStream.write(jsonBytes);

        zipOutputStream.closeEntry();
    }

    private void addToZip(ZipOutputStream zipOutputStream, File file, String zipEntryName) throws IOException {
        if (file == null || !file.exists()) {
            return;
        }

        try (FileInputStream fis = new FileInputStream(file)) {
            ZipEntry zipEntry = new ZipEntry(zipEntryName);
            zipOutputStream.putNextEntry(zipEntry);

            byte[] buffer = new byte[1024];
            int length;
            while ((length = fis.read(buffer)) > 0) {
                zipOutputStream.write(buffer, 0, length);
            }

            zipOutputStream.closeEntry();
        }
    }

    private static void enforceLimit(String base, Long connectionId, String type, int limit) {
        Path connectionFilesFolder = toPath(base, connectionId.toString());

        try (Stream<Path> stream = Files.list(connectionFilesFolder)) {
            List<Path> matchingDirs = stream
                    .filter(path -> Files.isRegularFile(path) && path.getFileName().toString().contains(connectionId + NAME_PARTS_SEPARATOR + type))
                    .sorted((p1, p2) -> {
                        LocalDateTime time1 = extractTime(p1);
                        LocalDateTime time2 = extractTime(p2);

                        return time1.compareTo(time2);
                    })
                    .toList();

            for (int i = 0; i < matchingDirs.size() - limit; i++) {
                delete(matchingDirs.get(i));
            }
        } catch (IOException e) {
            throw new RuntimeException(e);
        }
    }
}
