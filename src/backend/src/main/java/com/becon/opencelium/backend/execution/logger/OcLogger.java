package com.becon.opencelium.backend.execution.logger;

import ch.qos.logback.classic.LoggerContext;
import ch.qos.logback.classic.encoder.PatternLayoutEncoder;
import ch.qos.logback.classic.spi.ILoggingEvent;
import ch.qos.logback.core.FileAppender;
import com.becon.opencelium.backend.execution.logger.dto.LogDataDTO;
import com.becon.opencelium.backend.execution.socket.WebSocketNotificationService;
import com.becon.opencelium.backend.quartz.QuartzJobScheduler;
import com.becon.opencelium.backend.resource.execution.LoggerConfiguration;
import com.becon.opencelium.backend.utility.ApplicationContextUtility;
import com.becon.opencelium.backend.utility.LogFileUtility;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;

import java.io.IOException;
import java.io.PrintWriter;
import java.io.RandomAccessFile;
import java.io.StringWriter;
import java.nio.charset.StandardCharsets;
import java.nio.file.Files;
import java.nio.file.Path;
import java.util.Optional;
import java.util.function.Consumer;

public class OcLogger<T extends LogMessage> {
    private final boolean debugMode;
    private final boolean webSocket;
    private final boolean supportFile;
    private final T logEntity;
    private final WebSocketNotificationService socketNotificationService;
    private final LogLineDispatcher logLineDispatcher;
    private final long connectionId;
    private final Path filepath;
    private final Logger logger;

    public static final String LOG_LOCATION = "src/main/resources/logs";

    public OcLogger(LoggerConfiguration loggerConfiguration, T logEntity,
                    long connectionId, String timestamp, long executionId, Class<?> c) {
        this.debugMode = loggerConfiguration.isDebugMode();
        this.webSocket = loggerConfiguration.getTriggerType() == QuartzJobScheduler.TriggerType.EXECUTION_TEST;
        this.supportFile = loggerConfiguration.getTriggerType() == QuartzJobScheduler.TriggerType.SUPPORT_FILE;

        this.socketNotificationService = ApplicationContextUtility.getBean(WebSocketNotificationService.class);
        this.logLineDispatcher = new LogLineDispatcher();
        this.connectionId = connectionId;
        this.logEntity = logEntity;

        // set up the logger to create temporary log file in base log directory: type = u (uncategorized), not s (success) or f (fail):
        String loggerId = String.format("%d-%d", executionId, connectionId);
        String filename = LogFileUtility.toFilename(timestamp, connectionId, "u", executionId, "log");

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
    }

    public void close() {
        if (logger instanceof ch.qos.logback.classic.Logger classicLogger) {
            classicLogger.iteratorForAppenders().forEachRemaining(appender -> {
                if (appender instanceof FileAppender) {
                    appender.stop();
                }
            });

            classicLogger.detachAndStopAllAppenders();
        }

        if (!debugMode && !supportFile) {
            // debugMode = false && supportFile = false then there is nothing in logfile
            // so just delete it

            try {
                LogFileUtility.delete(filepath);
            } catch (IOException e) {}
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
        String stackTrace = getStackTraceAsString(e);
        String logMessage = "segment=EXCEPTION data=" + stackTrace;
        Consumer<String> printStrategy = logger::info;
        logAndSend(printStrategy, logMessage);
    }


    private <E> void logAndSend(Consumer<E> t, E message) {
        if (!debugMode && !supportFile) {
            return;
        }

        // evaluate startOffset before writing to a logfile
        long startOffset = getStartOffset();
        t.accept(message);
        long endOffset = getStartOffset();
        if (webSocket) {
            Optional<LogDataDTO> logData = logLineDispatcher.dispatch(message.toString(), startOffset, endOffset);
            if (logData.isPresent()) {
                socketNotificationService.send(connectionId, logData);
            }
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

    private String getStackTraceAsString(Throwable e) {
        StringWriter sw = new StringWriter();
        e.printStackTrace(new PrintWriter(sw));
        return sw.toString();
    }
}
