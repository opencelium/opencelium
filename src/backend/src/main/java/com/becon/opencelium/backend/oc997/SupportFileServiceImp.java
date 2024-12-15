package com.becon.opencelium.backend.oc997;

import jakarta.annotation.PostConstruct;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;

import java.io.File;
import java.io.IOException;
import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.Paths;
import java.util.List;

@Service
public class SupportFileServiceImp implements SupportFileService {
    @Value("${support.files.directory}")
    private String baseFolder;

    private static final Logger logger = LoggerFactory.getLogger(SupportFileService.class);

    @PostConstruct
    public void setup() {
        try {
            Path path = Paths.get(baseFolder);
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
        return null;
    }

    @Override
    public File getSupportFile(Long connectionId, String zipFileName) {
        return null;
    }

    @Override
    public File getSupportFile(Long connectionId) {
        return null;
    }
}
