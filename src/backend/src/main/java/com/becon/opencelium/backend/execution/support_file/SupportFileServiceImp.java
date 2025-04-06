package com.becon.opencelium.backend.execution.support_file;

import com.becon.opencelium.backend.database.mysql.entity.Connection;
import com.becon.opencelium.backend.database.mysql.entity.Connector;
import com.becon.opencelium.backend.database.mysql.service.ConnectionService;
import com.becon.opencelium.backend.database.mysql.service.ConnectorService;
import com.becon.opencelium.backend.enums.SupportFileStatus;
import com.becon.opencelium.backend.invoker.service.InvokerService;
import com.becon.opencelium.backend.mapper.base.Mapper;
import com.becon.opencelium.backend.resource.connection.ConnectionDTO;
import com.becon.opencelium.backend.resource.connection.old.ConnectionOldDTO;
import com.becon.opencelium.backend.resource.template.CtionTemplateResource;
import com.fasterxml.jackson.databind.ObjectMapper;
import jakarta.annotation.PostConstruct;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Value;
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
import static com.becon.opencelium.backend.utility.FileUtility.clear;
import static com.becon.opencelium.backend.utility.FileUtility.create;
import static com.becon.opencelium.backend.utility.FileUtility.delete;
import static com.becon.opencelium.backend.utility.FileUtility.toPath;

@Service
public class SupportFileServiceImp implements SupportFileService {
    private final ConnectionService connectionSqlService;
    private final Mapper<ConnectionOldDTO, CtionTemplateResource> oldDto2ResourceMapper;
    private final Mapper<ConnectionDTO, ConnectionOldDTO> dto2OldDtoMapper;
    private final ConnectorService connectorSqlService;
    private final InvokerService invokerService;

    @Value("${opencelium.support.file.directory:src/main/resources/support-files}")
    private String base;
    @Value("${opencelium.support.file.limit.success:1}")
    private int successFileLimit;
    @Value("${opencelium.support.file.limit.fail:5}")
    private int failFileLimit;

    public static final String GET_URL = "/connection/support-file/%d/%s";
    private static final Logger logger = LoggerFactory.getLogger(SupportFileService.class);

    public SupportFileServiceImp (
            ConnectionService connectionSqlService,
            Mapper<ConnectionOldDTO, CtionTemplateResource> oldDto2ResourceMapper,
            Mapper<ConnectionDTO, ConnectionOldDTO> dto2OldDtoMapper,
            ConnectorService connectorSqlService, InvokerService invokerService
    ) {
        this.connectionSqlService = connectionSqlService;
        this.oldDto2ResourceMapper = oldDto2ResourceMapper;
        this.dto2OldDtoMapper = dto2OldDtoMapper;
        this.connectorSqlService = connectorSqlService;
        this.invokerService = invokerService;
    }

    @PostConstruct
    public void setup() {
        try {
            // Create base directory to store support files:
            create(base);

            // Create base directory to store log files temporarily:
            create(LOG_LOCATION);
//            clear(LOG_LOCATION);

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
        String zipFileName = timestamp + "_" + connectionId + "_" + type + "_" + executionId + ".zip";
        Path zipFilePath = toPath(base, connectionId.toString(), zipFileName);

        // create parent directories if not exists:
        try {
            Files.createDirectories(zipFilePath.getParent());
        } catch (IOException e) {
            logger.error("Failed to create support file directory connectionId = '" + connectionId + "'");
            throw new RuntimeException(e);
        }

        try (
                FileOutputStream fos = new FileOutputStream(zipFilePath.toFile());
                ZipOutputStream zipOutputStream = new ZipOutputStream(fos)
        ) {
            ConnectionDTO dto = connectionSqlService.getFullConnection(connectionId);

            // Add Connection resource template as a JSON file:
            ConnectionOldDTO oldDTO = dto2OldDtoMapper.toDTO(dto);
            CtionTemplateResource template = oldDto2ResourceMapper.toDTO(oldDTO);
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

            // Add log file, then delete it from temporary location:
            String filename = timestamp + "_" + connectionId + "_" + executionId + ".log";
            Path filePath = toPath(LOG_LOCATION, filename);
            addToZip(zipOutputStream, filePath.toFile(), filename);
            delete(filePath);
        } catch (IOException e) {
            logger.error("Failed to create support file for connectionId = '" + connectionId + "'");
            throw new RuntimeException(e);
        } finally {
//            int fileLimit = "s".equals(type) ? successFileLimit : failFileLimit;
//            enforceLimit(zipFilePath.getParent(), connectionId + "_" + type + "_support", fileLimit);
        }
    }

    @Override
    public void deleteSupportFile(String zipFileName) {
        String connectionId = zipFileName.substring(0, zipFileName.indexOf('_'));
        Path zipPath =  toPath(base, connectionId, zipFileName);
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

    private void enforceLimit(Path base, String prefix, int limit) {
        try (Stream<Path> stream = Files.list(base)) {
            List<Path> matchingDirs = stream
                    .filter(path -> Files.isRegularFile(path) && path.getFileName().toString().startsWith(prefix))
                    .sorted((p1, p2) -> {
                        long time1 = extractTime(p1.getFileName().toString(), prefix);
                        long time2 = extractTime(p2.getFileName().toString(), prefix);

                        return Long.compare(time1, time2);
                    })
                    .toList();

            for (int i = 0; i < matchingDirs.size() - limit; i++) {
                delete(matchingDirs.get(i));
            }
        } catch (IOException e) {
            logger.error("Failed to enforce file limit for folder = " + base);
            throw new RuntimeException(e);
        }
    }

    private long extractTime(String dirName, String prefix) {
        try {
            return Long.parseLong(dirName.substring(prefix.length()));
        } catch (NumberFormatException e) {
            return Long.MAX_VALUE;
        }
    }
}
