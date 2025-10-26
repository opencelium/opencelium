package com.becon.opencelium.backend.utility;

import com.becon.opencelium.backend.commons.FileDescriptor;
import com.becon.opencelium.backend.constant.ExceptionConstant;
import com.becon.opencelium.backend.constant.ExceptionMessages;
import com.becon.opencelium.backend.exception.GeneralServiceException;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.http.HttpStatus;
import org.springframework.http.MediaType;

import java.io.BufferedReader;
import java.io.FileInputStream;
import java.io.IOException;
import java.io.InputStream;
import java.nio.file.FileVisitOption;
import java.nio.file.FileVisitResult;
import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.Paths;
import java.nio.file.SimpleFileVisitor;
import java.nio.file.StandardCopyOption;
import java.nio.file.attribute.BasicFileAttributes;
import java.time.LocalDateTime;
import java.util.List;
import java.util.stream.Collectors;
import java.util.stream.Stream;

import static com.becon.opencelium.backend.constant.LogConstant.DATE_TIME_FORMATTER;
import static com.becon.opencelium.backend.constant.LogConstant.LOG_FILE_EXTENSION;
import static com.becon.opencelium.backend.constant.LogConstant.LOG_FILE_NAME_RGX;
import static com.becon.opencelium.backend.constant.LogConstant.LOG_LOCATION;
import static com.becon.opencelium.backend.constant.LogConstant.NAME_PARTS_SEPARATOR;
import static com.becon.opencelium.backend.constant.LogConstant.UNCATEGORIZED;

public class LogFileUtility {
    private static final Logger logger = LoggerFactory.getLogger(LogFileUtility.class);

    public static Path toPath(String base, String... sub) {
        Path path = Paths.get(base, sub);

        return path.isAbsolute() ? path : Paths.get(System.getProperty("user.dir")).resolve(path).normalize();
    }

    public static String toFilename(String timestamp, long connectionId, String type, long executionId, String extension) {
        return timestamp + NAME_PARTS_SEPARATOR + connectionId + NAME_PARTS_SEPARATOR + type + NAME_PARTS_SEPARATOR + executionId + "." + extension;
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
                    .filter(path -> Files.isRegularFile(path) && path.getFileName().toString().contains(connectionId + NAME_PARTS_SEPARATOR + type))
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

    public static void move(Long connectionId, long executionId, String timestamp, String type, int fileLimit) {
        Path sourcePath = toPath(LOG_LOCATION, toFilename(timestamp, connectionId, UNCATEGORIZED, executionId, LOG_FILE_EXTENSION));
        Path destinationPath = toPath(LOG_LOCATION, connectionId.toString(), toFilename(timestamp, connectionId, type, executionId, LOG_FILE_EXTENSION));
        if (!Files.exists(sourcePath)) {
            return;
        }

        try {
            Files.createDirectories(destinationPath.getParent());

            Files.move(sourcePath, destinationPath, StandardCopyOption.REPLACE_EXISTING);
        } catch (IOException e) {
            throw new RuntimeException(e);
        } finally {
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

    public static void deleteByExecutionId(long executionId) {
        Path logFolder = toPath(LOG_LOCATION);

        try (Stream<Path> stream = Files.walk(logFolder)) {
            stream
                    .filter(Files::isRegularFile)
                    .filter(p -> {
                        String filename = p.getFileName().toString();

                        if (!filename.matches(LOG_FILE_NAME_RGX)) return false;

                        int start = filename.lastIndexOf('_');
                        int end = filename.lastIndexOf('.');
                        long fileExecutionId = Long.parseLong(filename.substring(start + 1, end));

                        return fileExecutionId == executionId;
                    })
                    .forEach(p -> {
                        try {
                            Files.deleteIfExists(p);
                        } catch (IOException ignored) {}
                    });
        } catch (IOException e) {
            logger.warn("Failed to delete old log files by executionId", e);
        }
    }

    public static FileDescriptor getLogFile(Long executionId) {
        Path logFolder = toPath(LOG_LOCATION);
        try (Stream<Path> stream = Files.walk(logFolder, FileVisitOption.FOLLOW_LINKS)) {

            return stream
                    .filter(x -> x.getFileName().toString().matches(LOG_FILE_NAME_RGX) && x.getFileName().toString().endsWith("%d.log".formatted(executionId)))
                    .findFirst()
                    .map(LogFileUtility::readFile)
                    .orElseThrow(() -> new GeneralServiceException(ExceptionConstant.LOG_NOT_FOUND, ExceptionMessages.LOG_NOT_FOUND.formatted(executionId)));

        } catch (IOException e) {
            logger.error(e.getMessage(), e);

            throw new GeneralServiceException(
                    HttpStatus.INTERNAL_SERVER_ERROR,
                    ExceptionConstant.INTERNAL_ERROR,
                    ExceptionMessages.UNKNOWN_ERROR
            );
        }
    }

    public static List<String> getLogFileNameList(Long connectionId) {
        Path logFolder = toPath(LOG_LOCATION + "/" + connectionId);

        try (Stream<Path> stream = Files.list(logFolder)) {
            return stream
                    .map(path -> path.getFileName().toString())
                    .filter(name -> name.matches(LOG_FILE_NAME_RGX))
                    .collect(Collectors.toList());
        } catch (IOException e) {
            logger.error("Error while reading log files from folder: {}", logFolder, e);
            throw new GeneralServiceException(
                    HttpStatus.INTERNAL_SERVER_ERROR,
                    ExceptionConstant.INTERNAL_ERROR,
                    ExceptionMessages.UNKNOWN_ERROR
            );
        }
    }

    public static List<String> getLogFileNameList(Long connectionId, int schedulerId, String status) {
        Path logFolder = toPath(LOG_LOCATION + "/" + connectionId);

        try (Stream<Path> stream = Files.list(logFolder)) {
            return stream
                    .filter(path -> path.getFileName().toString().matches(LOG_FILE_NAME_RGX))
                    .filter(path -> status == null || path.getFileName().toString().contains(status))
                    .filter(path -> executedByScheduler(path, schedulerId))
                    .map(path -> path.getFileName().toString())
                    .collect(Collectors.toList());
        } catch (IOException e) {
            logger.error("Error while reading log files from folder: {}", logFolder, e);
            throw new GeneralServiceException(
                    HttpStatus.INTERNAL_SERVER_ERROR,
                    ExceptionConstant.INTERNAL_ERROR,
                    ExceptionMessages.UNKNOWN_ERROR
            );
        }
    }

    private static FileDescriptor readFile(Path path) {
        try (InputStream in = new FileInputStream(path.toFile())) {
            return FileDescriptor.of(
                    in.readAllBytes(),
                    path.getFileName().toString(),
                    MediaType.APPLICATION_OCTET_STREAM_VALUE
            );
        } catch (IOException e) {
            throw new GeneralServiceException(
                    HttpStatus.INTERNAL_SERVER_ERROR,
                    ExceptionConstant.INTERNAL_ERROR,
                    ExceptionMessages.UNKNOWN_ERROR
            );
        }
    }

    private static LocalDateTime extractTime(Path path) {
        String filename = path.getFileName().toString();

        try {
            String timestamp = filename.substring(0, 16);
            return LocalDateTime.parse(timestamp, DATE_TIME_FORMATTER);
        } catch (Exception e) {
            return LocalDateTime.MIN;
        }
    }

    public static String extractExecutionId(String fileName) {
        if (fileName == null || !fileName.endsWith(".log")) {
            throw new IllegalArgumentException("Invalid log file name: " + fileName);
        }

        // Remove the ".log" extension
        String withoutExt = fileName.substring(0, fileName.length() - 4);
        String[] parts = withoutExt.split(NAME_PARTS_SEPARATOR);
        return parts[parts.length - 1];
    }

    private static boolean executedByScheduler(Path path, int schedulerId) {
        if (schedulerId == -1) {
            // if 'schedulerId' has default value then skip this filter
            return true;
        }

        String token = "schedulerId=" + schedulerId;
        try (BufferedReader reader = Files.newBufferedReader(path)) {
            String firstLine = reader.readLine();
            return firstLine != null && firstLine.contains(token);
        } catch (IOException e) {
            return false;
        }
    }
}