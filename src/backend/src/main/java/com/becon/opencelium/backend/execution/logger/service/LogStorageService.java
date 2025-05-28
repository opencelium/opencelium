package com.becon.opencelium.backend.execution.logger.service;

import com.becon.opencelium.backend.execution.logger.OcLogger;
import org.springframework.stereotype.Service;

import java.io.IOException;
import java.nio.file.DirectoryStream;
import java.nio.file.FileVisitResult;
import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.SimpleFileVisitor;
import java.nio.file.attribute.BasicFileAttributes;
import java.util.List;
import java.util.regex.Matcher;
import java.util.regex.Pattern;
import java.util.stream.Collectors;
import java.util.stream.Stream;

import static com.becon.opencelium.backend.utility.LogFileUtility.toPath;

/**
 * LogStorageService is responsible for locating and reading raw log lines from log files.
 * Assumes log files are organized in directories with numeric names,
 * and file names follow a convention: yyyy-MM-dd_HH-mm_<tag>_(f|s)_<executionId>.log
 */
@Service
public class LogStorageService {
    // Pattern to match log file names and extract executionId
    private static final Pattern FILE_NAME_PATTERN = Pattern.compile(
            "\\d{4}-\\d{2}-\\d{2}_\\d{2}-\\d{2}_.+_(f|s)_(.+)\\.log"
    );

    /**
     * Reads a specific block of log lines for a given executionId.
     *
     * @param execId the executionId to identify the log file
     * @param startOffset line number to start reading (1-based)
     * @param endOffset line number to stop reading (inclusive)
     * @return list of log lines in the given range
     */
    public List<String> readBlock(String execId, long startOffset, long endOffset) {
        Path logfile = getLogFileByExecutionId(execId);

        try (Stream<String> linesStream = Files.lines(logfile)) {
            return linesStream
                    .skip(startOffset - 1L)
                    .limit(endOffset - startOffset + 1L)
                    .collect(Collectors.toList());
        } catch (Exception e) {
            throw new RuntimeException(e);
        }
    }

    /**
     * Locates the log file that contains logs for the given executionId.
     * Searches all numeric-named directories under OcLogger.LOG_LOCATION.
     *
     * @param executionId ID of the execution to match in the file name
     * @return Path to the matched log file
     */
    private Path getLogFileByExecutionId(String executionId) {
        Path[] logfile = {null};
        Path root = toPath(OcLogger.LOG_LOCATION);

        try {
            Files.walkFileTree(root, new SimpleFileVisitor<>() {
                @Override
                public FileVisitResult preVisitDirectory(Path dir, BasicFileAttributes attrs) {
                    if (dir.getFileName().toString().matches("\\d+")) {
                        try (DirectoryStream<Path> stream = Files.newDirectoryStream(dir, "*.log")) {
                            for (Path path : stream) {
                                Matcher matcher = FILE_NAME_PATTERN.matcher(path.getFileName().toString());
                                if (matcher.matches() && matcher.group(2).equals(executionId)) {
                                    logfile[0] = path;
                                    return FileVisitResult.TERMINATE;
                                }
                            }
                        } catch (IOException e) {
                            throw new RuntimeException(e);
                        }
                    }
                    return FileVisitResult.CONTINUE;
                }
            });
        } catch (IOException e) {
            throw new RuntimeException(e);
        }

        if (logfile[0] == null) {
            throw new RuntimeException("Log file not found for executionId = " + executionId);
        }

        return logfile[0];
    }
}
