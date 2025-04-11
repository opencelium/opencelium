package com.becon.opencelium.backend.utility;

import com.becon.opencelium.backend.execution.support_file.SupportFileServiceImp;

import java.io.IOException;
import java.nio.file.FileVisitResult;
import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.Paths;
import java.nio.file.SimpleFileVisitor;
import java.nio.file.StandardCopyOption;
import java.nio.file.attribute.BasicFileAttributes;
import java.time.LocalDateTime;
import java.time.format.DateTimeFormatter;
import java.util.List;
import java.util.stream.Stream;

import static com.becon.opencelium.backend.execution.logger.OcLogger.LOG_LOCATION;

public class LogFileUtility {
    public static final DateTimeFormatter FORMATTER = DateTimeFormatter.ofPattern("yyyy-MM-dd_HH-mm");

    public static Path toPath(String base, String... sub) {
        Path path = Paths.get(base, sub);

        return path.isAbsolute() ? path : Paths.get(System.getProperty("user.dir")).resolve(path).normalize();
    }

    public static String toFilename(String timestamp, long connectionId, String type, long executionId, String extension) {
        return timestamp + "_" + connectionId + "_" + type + "_" + executionId + "." + extension;
    }

    public static void create(String base) throws IOException {
        Path directory = toPath(base);

        if (!Files.exists(directory)) {
            Files.createDirectories(directory);
        }
    }

    public static void enforceLimit(String base, Long connectionId, String type, int limit) {
        Path connectionFilesFolder = toPath(base, connectionId.toString());

        try (Stream<Path> stream = Files.list(connectionFilesFolder)) {
            List<Path> matchingDirs = stream
                    .filter(path -> Files.isRegularFile(path) && path.getFileName().toString().contains(connectionId + "_" + type))
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

    public static void move(String timestamp, Long connectionId, String type, long executionId) {
        Path sourcePath = toPath(LOG_LOCATION, toFilename(timestamp, connectionId, "u", executionId, "log"));
        Path destinationPath = toPath(LOG_LOCATION, connectionId.toString(), toFilename(timestamp, connectionId, type, executionId, "log"));

        try {
            Files.createDirectories(destinationPath.getParent());

            Files.move(sourcePath, destinationPath, StandardCopyOption.REPLACE_EXISTING);
        } catch (IOException e) {
            throw new RuntimeException(e);
        } finally {
            int fileLimit = "s".equals(type) ? SupportFileServiceImp.LOG_FILE_SUCCESS_LIMIT : SupportFileServiceImp.LOG_FILE_FAIL_LIMIT;
            enforceLimit(LOG_LOCATION, connectionId, type, fileLimit);
        }
    }

    public static void delete(Path path) throws IOException {
        if (Files.exists(path)) {
            Files.walkFileTree(path, new SimpleFileVisitor<>() {
                @Override
                public FileVisitResult visitFile(Path file, BasicFileAttributes attrs) throws IOException {
                    Files.delete(file);
                    return FileVisitResult.CONTINUE;
                }

                @Override
                public FileVisitResult postVisitDirectory(Path dir, IOException exc) throws IOException {
                    Files.delete(dir);
                    return FileVisitResult.CONTINUE;
                }
            });
        }
    }


    private static LocalDateTime extractTime(Path path) {
        String filename = path.getFileName().toString();

        try {
            String timestamp = filename.substring(0, 16);
            return LocalDateTime.parse(timestamp, FORMATTER);
        } catch (Exception e) {
            return LocalDateTime.MIN;
        }
    }
}