package com.becon.opencelium.backend.oc997;

import jakarta.annotation.PostConstruct;
import jakarta.persistence.EntityNotFoundException;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
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
                if (Files.isDirectory(file)) {
                    Long connectionId = Long.parseLong(file.getFileName().toString());
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
        Path path = getPath(connectionId.toString());

        if (Files.exists(path) && Files.isDirectory(path)) {
            List<String> urls = getZipUrls(connectionId, path);

            return new ConnectionSupportFiles(connectionId, urls);
        }

        throw new EntityNotFoundException("write description");
    }

    @Override
    public File getSupportFile(Long connectionId, String zipFileName) {
        Path path = getPath(connectionId.toString(), zipFileName);
        return path.toFile();
    }

    @Override
    public File getSupportFile(Long connectionId) {
        String filePattern = String.format(SUCCESS_PATTERN, connectionId);

        try (DirectoryStream<Path> stream = Files.newDirectoryStream(getPath(connectionId.toString()), filePattern)) {
            for (Path path : stream) {
                return path.toFile();
            }
        } catch (IOException e) {
            throw new RuntimeException(e);
        }

        throw new RuntimeException("e");
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
