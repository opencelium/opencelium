package com.becon.opencelium.backend.utility;

import java.io.IOException;
import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.Paths;
import java.util.stream.Stream;

public class LogUtility {
    private static final String LOG_LOCATION = "src/main/resources/logs";

    public static void setup() {
        try {
            Path directory = getPath();

            if (!Files.exists(directory)) {
                Files.createDirectories(directory);
            }

            cleanup(directory);
        } catch (IOException e) {
            throw new RuntimeException(e);
        }
    }

    public static void delete(String filename) {

    }

    public static Path getPath(Long connectionId, long timestamp) {
        // Returns absolute path to base directory and/or its subdirectories
        Path path = Paths.get(LOG_LOCATION, String.format("%d_%d.log", connectionId, timestamp));
        return path.isAbsolute() ? path : Paths.get(System.getProperty("user.dir")).resolve(path).normalize();
    }

    private static Path getPath() {
        // Returns absolute path to base directory and/or its subdirectories
        Path path = Paths.get(LOG_LOCATION);
        return path.isAbsolute() ? path : Paths.get(System.getProperty("user.dir")).resolve(path).normalize();
    }

    private static void cleanup(Path directory) throws IOException {
        try (Stream<Path> files = Files.list(directory)) {
            files.forEach(file -> {
                try {
                    Files.delete(file);
                } catch (IOException e) {
                    throw new RuntimeException(e);
                }
            });
        }
    }
}