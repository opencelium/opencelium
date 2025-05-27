package com.becon.opencelium.backend.execution.logger;

import org.springframework.stereotype.Service;

import java.io.IOException;
import java.io.RandomAccessFile;
import java.nio.charset.StandardCharsets;
import java.nio.file.DirectoryStream;
import java.nio.file.FileVisitResult;
import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.SimpleFileVisitor;
import java.nio.file.attribute.BasicFileAttributes;
import java.util.List;
import java.util.regex.Matcher;
import java.util.regex.Pattern;

import static com.becon.opencelium.backend.utility.LogFileUtility.toPath;

@Service
public class LogStorageManager {
    private static final Pattern FILE_NAME_PATTERN = Pattern.compile(
            "\\d{4}-\\d{2}-\\d{2}_\\d{2}-\\d{2}_.+_(u|f|s)_(.+)\\.log"
    );

    public List<String> readBlock(String execId, long startOffset, long endOffset) {
        Path logfile = getLogFileByExecutionId(execId);

        try (RandomAccessFile raf = new RandomAccessFile(logfile.toFile(), "r")) {
            long length = Math.max(endOffset - startOffset, 0);
            byte[] buffer = new byte[(int) length];
            raf.seek(startOffset);
            raf.readFully(buffer);
            String content = new String(buffer, StandardCharsets.UTF_8);

            return List.of(content.split("\\R"));
        } catch (Exception e) {
            throw new RuntimeException(e);
        }
    }


    private Path getLogFileByExecutionId(String executionId) {
        Path[] logfiles = {null, null}; // {'fail' or 'success', 'unknown'}
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
                                    logfiles[0] = path;
                                    return FileVisitResult.TERMINATE;
                                }
                            }
                        } catch (IOException e) {
                            throw new RuntimeException(e);
                        }
                    }
                    return FileVisitResult.CONTINUE;
                }

                @Override
                public FileVisitResult visitFile(Path file, BasicFileAttributes attrs) {
                    String filename = file.getFileName().toString();
                    if (filename.endsWith(".log")) {
                        Matcher matcher = FILE_NAME_PATTERN.matcher(filename);
                        if (matcher.matches() && matcher.group(2).equals(executionId)) {
                            logfiles[1] = file;
                        }
                    }

                    return FileVisitResult.CONTINUE;
                }
            });
        } catch (IOException e) {
            throw new RuntimeException(e);
        }

        if (logfiles[0] != null) {
            return logfiles[0];
        } else if (logfiles[1] != null) {
            return logfiles[1];
        } else {
            throw new RuntimeException("Log file not found for executionId = " + executionId);
        }
    }
}
