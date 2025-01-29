package com.becon.opencelium.backend.oc997;

import com.becon.opencelium.backend.database.mongodb.service.ConnectionMngService;
import com.becon.opencelium.backend.database.mysql.service.ConnectionService;
import com.becon.opencelium.backend.exception.ConnectionNotFoundException;
import jakarta.annotation.PostConstruct;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;

import java.io.File;
import java.io.IOException;
import java.nio.file.DirectoryStream;
import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.Paths;
import java.util.ArrayList;
import java.util.List;
import java.util.stream.Stream;

@Service
public class SupportFileServiceImp implements SupportFileService {
    @Autowired
    private ConnectionService sqlService;
    @Autowired
    private ConnectionMngService mongoService;

    @Value("${support.files.directory:src/main/resources/support-files}")
    private String baseFolder;

    public static final String GET_URL = "/api/connection/support-file/%d/%s"; // /api/connection/support-file/{connectionId}/{zipFileName}
    public static final String FILE_NAME = "%d_%s_support_%d"; // {connectionId}_{e | s}_support_{timestamp}
    public static final String SUCCESS_PATTERN = "%d_s_support_*.zip"; // {connectionId}_s_support_*.zip

    private static final Logger logger = LoggerFactory.getLogger(SupportFileService.class);

    @PostConstruct
    public void setup() {
        try {
            Path path = getPath();

            if (!Files.exists(path)) {
                Files.createDirectories(path);
            }

            logger.info("Base folder has been setup for support files, path = " + baseFolder);
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
        String filePattern = String.format(SUCCESS_PATTERN, connectionId);

        try (DirectoryStream<Path> stream = Files.newDirectoryStream(getPath(connectionId.toString()), filePattern)) {
            for (Path path : stream) {
                return path.toFile();
            }
        } catch (IOException e) {
            throw new RuntimeException(e);
        }

        throw new RuntimeException("Support file for successful execution not found for connectionId = " + connectionId);
    }

    private void throwIfConnectionNotExistsById(Long connectionId) {
        boolean exists = sqlService.existsById(connectionId) && mongoService.existsByConnectionId(connectionId);

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
}
