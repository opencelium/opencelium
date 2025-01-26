package com.becon.opencelium.backend.oc997;

import com.becon.opencelium.backend.database.mongodb.service.ConnectionMngService;
import com.becon.opencelium.backend.database.mysql.entity.Connector;
import com.becon.opencelium.backend.database.mysql.service.ConnectionService;
import com.becon.opencelium.backend.database.mysql.service.ConnectorService;
import com.becon.opencelium.backend.exception.ConnectionNotFoundException;
import com.becon.opencelium.backend.invoker.service.InvokerService;
import com.becon.opencelium.backend.mapper.base.Mapper;
import com.becon.opencelium.backend.resource.connection.ConnectionDTO;
import com.becon.opencelium.backend.resource.connection.old.ConnectionOldDTO;
import com.becon.opencelium.backend.resource.template.CtionTemplateResource;
import com.becon.opencelium.backend.utility.LogUtility;
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
import java.nio.file.FileVisitResult;
import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.Paths;
import java.nio.file.SimpleFileVisitor;
import java.nio.file.attribute.BasicFileAttributes;
import java.util.ArrayList;
import java.util.List;
import java.util.stream.Stream;
import java.util.zip.ZipEntry;
import java.util.zip.ZipOutputStream;

@Service
public class SupportFileServiceImp implements SupportFileService {
    private final ConnectionService connectionSqlService;
    private final Mapper<ConnectionOldDTO, CtionTemplateResource> oldDto2ResourceMapper;
    private final Mapper<ConnectionDTO, ConnectionOldDTO> dto2OldDtoMapper;
    private final ConnectionMngService connectionMngService;
    private final ConnectorService connectorSqlService;
    private final InvokerService invokerService;

    @Value("${support.files.directory:src/main/resources/support-files}")
    private String baseFolder;

    public static final String GET_URL = "/api/connection/support-file/%d/%s"; // /api/connection/support-file/{connectionId}/{zipFileName}
    private static final Logger logger = LoggerFactory.getLogger(SupportFileService.class);

    public SupportFileServiceImp (
            ConnectionService connectionSqlService,
            Mapper<ConnectionOldDTO, CtionTemplateResource> oldDto2ResourceMapper,
            Mapper<ConnectionDTO, ConnectionOldDTO> dto2OldDtoMapper,
            ConnectionMngService connectionMngService,
            ConnectorService connectorSqlService, InvokerService invokerService
    ) {
        this.connectionSqlService = connectionSqlService;
        this.oldDto2ResourceMapper = oldDto2ResourceMapper;
        this.dto2OldDtoMapper = dto2OldDtoMapper;
        this.connectionMngService = connectionMngService;
        this.connectorSqlService = connectorSqlService;
        this.invokerService = invokerService;
    }

    @PostConstruct
    public void setup() {
        try {
            // Create base directory to store support files:
            Path path = getPath();

            if (!Files.exists(path)) {
                Files.createDirectories(path);
            }

            // Create base directory to store log files temporarily:
            LogUtility.setup();

            logger.info("Base folders have been setup for support and log files, path = " + baseFolder);
        } catch (IOException e) {
            logger.error("Failed to setup base folder for support files, path = " + baseFolder);
        }
    }

    @Override
    public List<ConnectionSupportFiles> supportFileList() {
        Path path = getPath();

        List<ConnectionSupportFiles> result = new ArrayList<>();

        try (Stream<Path> files = Files.list(path)) {
            files.forEach(file -> {
                String fileName = file.getFileName().toString();

                if (Files.isDirectory(file) && fileName.matches("\\d+")) {
                    Long connectionId = Long.parseLong(fileName);
                    List<String> urls = getZipUrls(connectionId, file);

                    result.add(new ConnectionSupportFiles(connectionId, urls));
                }
            });
        } catch (IOException e) {
            throw new RuntimeException(e);
        }

        return result;
    }

    @Override
    public ConnectionSupportFiles connectionSupportFileList(Long connectionId) {
        // check whether connection exists in both DBs
        throwIfConnectionNotExistsById(connectionId);

        // check whether directory exists for this connection
        Path path = getPath(connectionId.toString());

        if (Files.isDirectory(path)) {
            List<String> urls = getZipUrls(connectionId, path);

            return new ConnectionSupportFiles(connectionId, urls);
        } else {
            return new ConnectionSupportFiles(connectionId);
        }
    }

    @Override
    public File getSupportFile(Long connectionId, String zipFileName) {
        // check whether connection exists in both DBs
        throwIfConnectionNotExistsById(connectionId);

        // check whether file exists for this connection
        Path path = getPath(connectionId.toString(), zipFileName);

        if (Files.isRegularFile(path)) {
            return path.toFile();
        } else {
            throw new RuntimeException("Support file with name ='" + zipFileName + "' not found");
        }
    }

    @Override
    public File getSupportFile(Long connectionId) {
        // check whether connection exists in both DBs
        throwIfConnectionNotExistsById(connectionId);

        // try to find successful execution support file by pattern
        String filePattern = connectionId + "_s_support_*.zip";

        try (DirectoryStream<Path> stream = Files.newDirectoryStream(getPath(connectionId.toString()), filePattern)) {
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
    public void collectFiles(Long connectionId, long timestamp, String type) {
        // create temporary file collection directory:
        String zipFileName = connectionId + "_" + type + "_support_" + timestamp + ".zip";
        Path zipFilePath = getPath(connectionId.toString(), zipFileName);

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

            // Add log file:
            File logFile = LogUtility.getPath(connectionId, timestamp).toFile();
            addToZip(zipOutputStream, logFile, logFile.getName());
        } catch (IOException e) {
            logger.error("Failed to create support file for connectionId = '" + connectionId + "'");
            throw new RuntimeException(e);
        } finally {
            int fileLimit = "s".equals(type) ? 1 : 5; // 1 for successful execution and 5 for failed execution
            enforceLimit(zipFilePath.getParent(), connectionId + "_" + type + "_support", fileLimit);
        }
    }

    private void throwIfConnectionNotExistsById(Long connectionId) {
        boolean exists = connectionSqlService.existsById(connectionId) && connectionMngService.existsByConnectionId(connectionId);

        if (!exists) {
            throw new ConnectionNotFoundException(connectionId);
        }
    }

    private Path getPath(String... sub) {
        // Returns absolute path to base directory and/or its subdirectories
        Path path = Paths.get(baseFolder, sub);

        return path.isAbsolute() ? path : Paths.get(System.getProperty("user.dir")).resolve(path).normalize();
    }

    private List<String> getZipUrls(Long connectionId, Path path) {
        List<String> names = new ArrayList<>();

        try (DirectoryStream<Path> zips = Files.newDirectoryStream(path, "*.zip")) {
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
                deleteDirectory(matchingDirs.get(i));
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

    private void deleteDirectory(Path dir) throws IOException {
        Files.walkFileTree(dir, new SimpleFileVisitor<>() {
            @Override
            public FileVisitResult visitFile(Path file, BasicFileAttributes attrs) throws IOException {
                Files.delete(file);
                return FileVisitResult.CONTINUE;
            }

            @Override
            public FileVisitResult postVisitDirectory(Path innerDir, IOException exc) throws IOException {
                Files.delete(innerDir);
                return FileVisitResult.CONTINUE;
            }
        });
    }
}
