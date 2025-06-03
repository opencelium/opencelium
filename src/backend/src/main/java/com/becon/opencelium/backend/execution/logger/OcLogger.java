package com.becon.opencelium.backend.execution.logger;

import ch.qos.logback.classic.LoggerContext;
import ch.qos.logback.classic.encoder.PatternLayoutEncoder;
import ch.qos.logback.classic.spi.ILoggingEvent;
import ch.qos.logback.core.FileAppender;
import com.becon.opencelium.backend.database.mongodb.entity.LogMetaData;
import com.becon.opencelium.backend.execution.logger.enums.LogLineType;
import com.becon.opencelium.backend.execution.logger.parser.ParsedLogLineBuilder;
import com.becon.opencelium.backend.execution.logger.parser.entity.ParsedLogLine;
import com.becon.opencelium.backend.execution.socket.WebSocketNotificationService;
import com.becon.opencelium.backend.resource.execution.LoggerConfiguration;
import com.becon.opencelium.backend.utility.ApplicationContextUtility;
import com.becon.opencelium.backend.utility.LogFileUtility;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;

import java.io.IOException;
import java.io.RandomAccessFile;
import java.nio.charset.StandardCharsets;
import java.nio.file.Files;
import java.nio.file.Path;
import java.util.Optional;
import java.util.function.Consumer;

public class OcLogger<T extends LogMessage> {
    private final boolean debugMode;
    private final boolean log2File;
    private final boolean webSocket;
    private final T logEntity;
    private final WebSocketNotificationService socketNotificationService;
    private final LogLineDispatcher logLineDispatcher;
    private final long connectionId;
    private final Path filepath;
    private final Logger logger;
    ParsedLogLineBuilder parsedLogLineBuilder;

    public static final String LOG_LOCATION = "src/main/resources/logs";

    public OcLogger(LoggerConfiguration loggerConfiguration, T logEntity,
                    long connectionId, String timestamp, long executionId, Class<?> c) {
        this.debugMode = loggerConfiguration.isDebugMode();
        this.log2File = loggerConfiguration.isLog2File();
        this.webSocket = loggerConfiguration.isWSocketOpen();

        this.socketNotificationService = ApplicationContextUtility.getBean(WebSocketNotificationService.class);
        this.parsedLogLineBuilder = ApplicationContextUtility.getBean(ParsedLogLineBuilder.class);
        this.logLineDispatcher = new LogLineDispatcher();
        this.connectionId = connectionId;
        this.logEntity = logEntity;

        if (log2File && debugMode) {
            String loggerId = String.format("%d-%d", executionId, connectionId);
            String filename = LogFileUtility.toFilename(timestamp, connectionId, "u", executionId, "log");

            // create temporary log file in base log directory: type = u (uncategorized), not s (success) or f (fail):
            this.filepath = LogFileUtility.toPath(LOG_LOCATION, filename);

            LoggerContext context = (LoggerContext) LoggerFactory.getILoggerFactory();
            FileAppender<ILoggingEvent> fileAppender = new FileAppender<>();
            fileAppender.setName("FileAppender-" + loggerId);
            fileAppender.setContext(context);
            fileAppender.setFile(filepath.toString());

            PatternLayoutEncoder encoder = new PatternLayoutEncoder();
            encoder.setContext(context);
            encoder.setPattern("%d{dd-MM-yyyy HH:mm:ss.SSS} - %msg%n");
            encoder.setCharset(StandardCharsets.UTF_8);
            encoder.start();

            fileAppender.setEncoder(encoder);
            fileAppender.start();

            ch.qos.logback.classic.Logger logger = (ch.qos.logback.classic.Logger) LoggerFactory.getLogger(loggerId);
            logger.addAppender(fileAppender);
            logger.setAdditive(false); // do not pass message to parent, just write to the file

            this.logger = logger;
        } else {
            this.filepath = null;
            this.logger = LoggerFactory.getLogger(c);
        }
    }

    public void close() {
        if (log2File && logger instanceof ch.qos.logback.classic.Logger classicLogger) {
            classicLogger.iteratorForAppenders().forEachRemaining(appender -> {
                if (appender instanceof FileAppender) {
                    appender.stop();
                }
            });

            classicLogger.detachAndStopAllAppenders();
        }
    }

    public T getLogEntity() {
        return logEntity;
    }

    public void logAndSend(String message){
        Consumer<String> printStrategy = logger::info;
        logAndSend(printStrategy, message);
    }

    public void logAndSend(Exception e){
        Consumer<Exception> printStrategy = x -> {
            logger.error(e.getMessage(), e);
        };

        logAndSend(printStrategy, e);
    }


    private <E> void logAndSend(Consumer<E> t, E message) {
        if (!debugMode) {
            return;
        }

        long startOffset = -1;
        if (log2File) {
            // evaluate startOffset before writing to a logfile
            startOffset = getStartOffset();

            t.accept(message);
        }

        if (webSocket) {
            ParsedLogLine parsedLine = parsedLogLineBuilder.build(message.toString(), startOffset);
            Optional<LogMetaData> logMetaData = logLineDispatcher.dispatch(parsedLine);

            if (logMetaData.isPresent() && (logMetaData.get().getLogLineType() == LogLineType.PHASE)) {
                Object obj = logLineDispatcher.toDto(logMetaData.get());
                socketNotificationService.send(connectionId, obj);
            }
        } else {
            t.accept(message);
        }
    }

    private long getStartOffset() {
        try {
            return evaluateUsingFiles();
        } catch (IOException e) {
            return evaluateUsingRAF();
        }
    }

    private long evaluateUsingFiles() throws IOException {
        return Files.size(filepath);
    }

    private long evaluateUsingRAF() {
        try (RandomAccessFile raf = new RandomAccessFile(filepath.toFile(), "r")) {
            return raf.length();
        } catch (IOException e) {
            throw new RuntimeException(e);
        }
    }
}
