package com.becon.opencelium.backend.oc997;

import com.becon.opencelium.backend.database.mongodb.service.ConnectionMngService;
import com.becon.opencelium.backend.database.mysql.entity.Connection;
import com.becon.opencelium.backend.database.mysql.entity.Connector;
import com.becon.opencelium.backend.database.mysql.service.ConnectionService;
import com.becon.opencelium.backend.database.mysql.service.ConnectorService;
import com.becon.opencelium.backend.exception.ConnectionNotFoundException;
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
import java.nio.file.FileVisitResult;
import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.Paths;
import java.nio.file.SimpleFileVisitor;
import java.nio.file.StandardCopyOption;
import java.nio.file.attribute.BasicFileAttributes;
import java.time.LocalDateTime;
import java.time.ZoneOffset;
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

    public SupportFileServiceImp(
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
            Path path = getPath();

            if (!Files.exists(path)) {
                Files.createDirectories(path);
            }

            logger.info("Base folder has been setup for support files, path = " + baseFolder);

            // do cleanup
            cleanup();
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
    public void createSupportFile(Long connectionId, String type) {
        Connection connection = connectionSqlService.getById(connectionId);

        // create temporary file collection directory:
        String directory = connectionId + "_" + type + "_support";

        try {
            Files.createDirectories(getPath(connectionId.toString(), directory));

            // create json copy of connection
            ObjectMapper objectMapper = new ObjectMapper();

            ConnectionDTO dto = connectionSqlService.getFullConnection(connectionId);
            ConnectionOldDTO oldDTO = dto2OldDtoMapper.toDTO(dto);
            Path path = getPath(connectionId.toString(), directory, "connection_template.json");
            File json = path.toFile();
            objectMapper.writeValue(json, oldDto2ResourceMapper.toDTO(oldDTO));

            // copy invoker files:
            int fromConnectorId = dto.getFromConnector().getConnectorId();
            Connector fromConnector = connectorSqlService.getById(fromConnectorId);
            File fromInvoker = invokerService.findFileByInvokerName(fromConnector.getInvoker());
            Path fromDestination = getPath(connectionId.toString(), directory, fromConnector.getInvoker() + ".xml");
            Files.copy(fromInvoker.toPath(), fromDestination, StandardCopyOption.REPLACE_EXISTING);

            int toConnectorId = dto.getToConnector().getConnectorId();
            Connector toConnector = connectorSqlService.getById(toConnectorId);
            File toInvoker = invokerService.findFileByInvokerName(toConnector.getInvoker());
            Path toDestination = getPath(connectionId.toString(), directory, toConnector.getInvoker() + ".xml");
            Files.copy(toInvoker.toPath(), toDestination, StandardCopyOption.REPLACE_EXISTING);

            // convert collected files directory to .zip
            zip(connectionId, directory);
        } catch (IOException e) {
            logger.error("Failed to create support file for connectionId = '" + connectionId + "'");
            throw new RuntimeException(e);
        } finally {
            cleanup(connectionId);
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

    private void zip(Long connectionId, String directory) throws IOException {
        long time = LocalDateTime.now().toEpochSecond(ZoneOffset.UTC);
        String zipName = directory + "_" + time;

        File source = getPath(connectionId.toString(), directory).toFile();
        File destination = getPath(connectionId.toString(), zipName + ".zip").toFile();

        try (
                FileOutputStream fos = new FileOutputStream(destination);
                ZipOutputStream zipOut = new ZipOutputStream(fos)
        ) {
            zip(source, zipName, zipOut);
        }
    }

    private static void zip(File file, String fileName, ZipOutputStream zipOut) throws IOException {
        if (file.isDirectory()) {
            if (fileName.endsWith("/")) {
                zipOut.putNextEntry(new ZipEntry(fileName));
                zipOut.closeEntry();
            } else {
                zipOut.putNextEntry(new ZipEntry(fileName + "/"));
                zipOut.closeEntry();
            }

            File[] children = file.listFiles();
            if (children != null) {
                for (File child : children) {
                    zip(child, fileName + "/" + child.getName(), zipOut);
                }
            }

            return;
        }

        try (FileInputStream fis = new FileInputStream(file)) {
            ZipEntry zipEntry = new ZipEntry(fileName);
            zipOut.putNextEntry(zipEntry);
            byte[] bytes = new byte[1024];
            int length;

            while ((length = fis.read(bytes)) >= 0) {
                zipOut.write(bytes, 0, length);
            }
        }
    }

    private void cleanup() {
        Path path = getPath();

        try (Stream<Path> files = Files.list(path)) {
            files.forEach(file -> {
                String fileName = file.getFileName().toString();

                if (Files.isDirectory(file) && fileName.matches("\\d+")) {
                    Long connectionId = Long.parseLong(fileName);
                    cleanup(connectionId);
                }
            });
        } catch (IOException e) {
            throw new RuntimeException(e);
        }

    }

    private void cleanup(Long connectionId) {
        Path base = getPath(connectionId.toString());

        try {
            Files.walkFileTree(base, new SimpleFileVisitor<>() {
                @Override
                public FileVisitResult visitFile(Path file, BasicFileAttributes attrs) {
                    return FileVisitResult.CONTINUE;
                }

                @Override
                public FileVisitResult postVisitDirectory(Path dir, IOException exc) throws IOException {
                    String dirName = dir.getFileName().toString();

                    if (dirName.equals(connectionId + "_e_support") || dirName.equals(connectionId + "_s_support")) {
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

                    return FileVisitResult.CONTINUE;
                }
            });
        } catch (IOException e) {
            logger.error("Failed to cleanup temporary support file directory for connectionId = '" + connectionId + "'");
        }
    }
}
