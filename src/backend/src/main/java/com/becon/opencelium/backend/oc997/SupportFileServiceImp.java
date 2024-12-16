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

@Service
public class SupportFileServiceImp implements SupportFileService {
    @Value("${support.files.directory:src/main/resources/support-files}")
    private String baseFolder;

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
        return null;
    }

    @Override
    public ConnectionSupportFiles connectionSupportFileList(Long connectionId) {
        // TODO: validate connectionId existance

        Path path = getPath(connectionId.toString());
        List<String> names = new ArrayList<>();

        if (Files.exists(path) && Files.isDirectory(path)) {
            try (DirectoryStream<Path> stream = Files.newDirectoryStream(path, "*.zip")) {
                for (Path p : stream) {
                    if (!Files.isDirectory(p)) {
                        names.add(p.getFileName().toString());
                    }
                }

                return new ConnectionSupportFiles(connectionId, names);
            } catch (IOException e) {
            }
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
        return null;
    }


    private Path getPath(String ... sub) {
        // Returns absolute path to base directory and/or its subdirectories
        Path path = Paths.get(baseFolder, sub);

        return path.isAbsolute() ? path : Paths.get(System.getProperty("user.dir")).resolve(path).normalize();
    }
}
