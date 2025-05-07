package com.becon.opencelium.backend.execution.support_file;

import com.becon.opencelium.backend.constant.AppYamlPath;
import com.becon.opencelium.backend.database.mysql.entity.Connection;
import com.becon.opencelium.backend.database.mysql.entity.Connector;
import com.becon.opencelium.backend.database.mysql.service.ConnectionService;
import com.becon.opencelium.backend.database.mysql.service.ConnectorService;
import com.becon.opencelium.backend.enums.SupportFileStatus;
import com.becon.opencelium.backend.execution.socket.SocketConstant;
import com.becon.opencelium.backend.execution.socket.WebSocketNotificationService;
import com.becon.opencelium.backend.invoker.service.InvokerService;
import com.becon.opencelium.backend.mapper.base.Mapper;
import com.becon.opencelium.backend.resource.connection.ConnectionDTO;
import com.becon.opencelium.backend.resource.connection.old.ConnectionOldDTO;
import com.becon.opencelium.backend.resource.template.CtionTemplateResource;
import com.fasterxml.jackson.databind.ObjectMapper;
import jakarta.annotation.PostConstruct;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.core.env.Environment;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.io.File;
import java.io.FileInputStream;
import java.io.FileOutputStream;
import java.io.IOException;
import java.nio.file.DirectoryStream;
import java.nio.file.Files;
import java.nio.file.Path;

import java.util.ArrayList;
import java.util.List;
import java.util.stream.Stream;
import java.util.zip.ZipEntry;
import java.util.zip.ZipOutputStream;

import static com.becon.opencelium.backend.execution.logger.OcLogger.LOG_LOCATION;
import static com.becon.opencelium.backend.utility.LogFileUtility.create;
import static com.becon.opencelium.backend.utility.LogFileUtility.delete;
import static com.becon.opencelium.backend.utility.LogFileUtility.enforceLimit;
import static com.becon.opencelium.backend.utility.LogFileUtility.toFilename;
import static com.becon.opencelium.backend.utility.LogFileUtility.toPath;

@Service
public class SupportFileServiceImp implements SupportFileService {
    private final ConnectionService connectionSqlService;
    private final Mapper<ConnectionOldDTO, CtionTemplateResource> oldDto2ResourceMapper;
    private final Mapper<ConnectionDTO, ConnectionOldDTO> dto2OldDtoMapper;
    private final ConnectorService connectorSqlService;
    private final InvokerService invokerService;
    private final WebSocketNotificationService notificationService;
    private final String base;
    private final int supportFileSuccessLimit;
    private final int supportFileFailLimit;

    public static final String GET_URL = "/connection/support-file/%d/%s";
    private static final Logger logger = LoggerFactory.getLogger(SupportFileService.class);

    public SupportFileServiceImp (
            ConnectionService connectionSqlService,
            Mapper<ConnectionOldDTO, CtionTemplateResource> oldDto2ResourceMapper,
            Mapper<ConnectionDTO, ConnectionOldDTO> dto2OldDtoMapper,
            ConnectorService connectorSqlService, InvokerService invokerService,
            WebSocketNotificationService notificationService, Environment env
    ) {
        this.connectionSqlService = connectionSqlService;
        this.oldDto2ResourceMapper = oldDto2ResourceMapper;
        this.dto2OldDtoMapper = dto2OldDtoMapper;
        this.connectorSqlService = connectorSqlService;
        this.invokerService = invokerService;
        this.notificationService = notificationService;

        // initialize application property related variables
        this.base = env.getProperty(AppYamlPath.SUPPORT_FILE_BASE_DIRECTORY, String.class, "src/main/resources/support-files");
        this.supportFileSuccessLimit = env.getProperty(AppYamlPath.SUPPORT_FILE_SUCCESS_LIMIT, Integer.class, 1);
        this.supportFileFailLimit = env.getProperty(AppYamlPath.SUPPORT_FILE_FAIL_LIMIT, Integer.class, 5);
    }

    @PostConstruct
    public void setup() {
        try {
            // Create base directory to store support files:
            create(base);

            // Create base directory to store log files:
            create(LOG_LOCATION);

            logger.info("Base folders have been setup for support and log files.");
        } catch (IOException e) {
            logger.error("Failed to setup base folder for support and log files.");
        }
    }

    @Override
    @Transactional(readOnly = true)
    public List<SupportFile> supportFileList() {
        Path path = toPath(base);

        List<SupportFile> result = new ArrayList<>();

        try (Stream<Path> files = Files.list(path)) {
            files.forEach(file -> {
                String fileName = file.getFileName().toString();

                if (Files.isDirectory(file) && fileName.matches("\\d+")) {
                    Long connectionId = Long.parseLong(fileName);
                    List<String> urls = getZipUrls(connectionId, file);

                    String connectionTitle;
                    SupportFileStatus status;
                    String message;

                    if (connectionSqlService.existsById(connectionId)) {
                        Connection connection = connectionSqlService.getById(connectionId);

                        connectionTitle = connection.getTitle();
                        status = SupportFileStatus.CONNECTION_FOUND;
                        message = "Connection is found.";
                    } else {
                        connectionTitle = null;
                        status = SupportFileStatus.CONNECTION_IS_MISSING;
                        message = "Connection not found.";
                    }

                    urls.forEach(url -> result.add(new SupportFile(connectionId, connectionTitle, url, status, message)));
                }
            });
        } catch (IOException e) {
            throw new RuntimeException(e);
        }

        return result;
    }

    @Override
    public List<SupportFile> connectionSupportFileList(Long connectionId) {
        Path path = toPath(base, connectionId.toString());

        List<SupportFile> result = new ArrayList<>();

        if (Files.isDirectory(path)) {
            List<String> urls = getZipUrls(connectionId, path);

            String connectionTitle;
            SupportFileStatus status;
            String message;

            if (connectionSqlService.existsById(connectionId)) {
                Connection connection = connectionSqlService.getById(connectionId);

                connectionTitle = connection.getTitle();
                status = SupportFileStatus.CONNECTION_FOUND;
                message = "Connection is found.";
            } else {
                connectionTitle = null;
                status = SupportFileStatus.CONNECTION_IS_MISSING;
                message = "Connection not found.";
            }

            urls.forEach(url -> result.add(new SupportFile(connectionId, connectionTitle, url, status, message)));
        }

        return result;
    }

    @Override
    public File getSupportFile(Long connectionId, String zipFileName) {
        // check whether file exists for this connection
        Path path = toPath(base, connectionId.toString(), zipFileName);

        if (Files.isRegularFile(path)) {
            return path.toFile();
        } else {
            throw new RuntimeException("Support file with name ='" + zipFileName + "' not found");
        }
    }

    @Override
    public File getSupportFile(Long connectionId) {
        // try to find successful execution support file by pattern
        String filePattern =  "*_" + connectionId + "_s_*.zip";

        try (DirectoryStream<Path> stream = Files.newDirectoryStream(toPath(base, connectionId.toString()), filePattern)) {
            for (Path path : stream) {
                return path.toFile();
            }
        } catch (IOException e) {
            throw new RuntimeException(e);
        }

        throw new RuntimeException("Support file for successful execution not found for connectionId = " + connectionId);
    }

    @Override
    @Transactional(readOnly = true)
    public void collectFiles(Long connectionId, long executionId, String timestamp, String type) {
        // create temporary file collection directory:
        String zipFilename = toFilename(timestamp, connectionId, type, executionId, "zip");
        Path zipFilePath = toPath(base, connectionId.toString(), zipFilename);

        // create parent directories if not exists:
        try {
            Files.createDirectories(zipFilePath.getParent());
        } catch (IOException e) {
            logger.error("Failed to create support file directory connectionId = '" + connectionId + "'");
            throw new RuntimeException(e);
        }

        String connectionTitle = null;
        try (
                FileOutputStream fos = new FileOutputStream(zipFilePath.toFile());
                ZipOutputStream zipOutputStream = new ZipOutputStream(fos)
        ) {
            ConnectionDTO dto = connectionSqlService.getFullConnection(connectionId);

            // Add Connection resource template as a JSON file:
            ConnectionOldDTO oldDTO = dto2OldDtoMapper.toDTO(dto);
            CtionTemplateResource template = oldDto2ResourceMapper.toDTO(oldDTO);
            connectionTitle = template.getTitle();
            addToZip(zipOutputStream, template, "connection_template.json");

            // Add invoker files:
            int fromConnectorId = dto.getFromConnector().getConnectorId();
            Connector fromConnector = connectorSqlService.getById(fromConnectorId);
            File fromInvoker = invokerService.findFileByInvokerName(fromConnector.getInvoker());
            addToZip(zipOutputStream, fromInvoker, fromConnector.getInvoker() + ".xml");

            int toConnectorId = dto.getToConnector().getConnectorId();
            if (fromConnectorId != toConnectorId) {
                Connector toConnector = connectorSqlService.getById(toConnectorId);
                File toInvoker = invokerService.findFileByInvokerName(toConnector.getInvoker());
                addToZip(zipOutputStream, toInvoker, toConnector.getInvoker() + ".xml");
            }

            // copy temporary uncategorized log file into zip, then delete it:
            Path filePath = toPath(LOG_LOCATION, toFilename(timestamp, connectionId, "u", executionId, "log"));
            addToZip(zipOutputStream, filePath.toFile(), toFilename(timestamp, connectionId, type, executionId, "log"));
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

            logger.error("Failed to create support file for connectionId = '" + connectionId + "'");
            throw new RuntimeException(e);
        } finally {
            int fileLimit = "s".equals(type) ? supportFileSuccessLimit : supportFileFailLimit;
            enforceLimit(base, connectionId, type, fileLimit);
        }
    }

    @Override
    public void deleteSupportFile(String zipFilename) {
        String dateRemoved = zipFilename.substring(17);
        String connectionId = dateRemoved.substring(0, dateRemoved.indexOf('_'));
        Path zipPath =  toPath(base, connectionId, zipFilename);

        try {
            delete(zipPath);
        } catch (IOException e) {
            throw new RuntimeException(e);
        }
    }


    private List<String> getZipUrls(Long connectionId, Path directory) {
        List<String> names = new ArrayList<>();

        try (DirectoryStream<Path> zips = Files.newDirectoryStream(directory, "*.zip")) {
            zips.forEach(zip -> {
                if (Files.isRegularFile(zip)) {
                    names.add(String.format(GET_URL, connectionId, zip.getFileName().toString()));
                }
            });

            return names;
        } catch (IOException e) {
            throw new RuntimeException(e);
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
}
