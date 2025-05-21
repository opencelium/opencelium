package com.becon.opencelium.backend.execution.logger;

import ch.qos.logback.classic.LoggerContext;
import ch.qos.logback.classic.encoder.PatternLayoutEncoder;
import ch.qos.logback.classic.spi.ILoggingEvent;
import ch.qos.logback.core.FileAppender;
import com.becon.opencelium.backend.execution.socket.WebSocketNotificationService;
import com.becon.opencelium.backend.resource.execution.LoggerConfiguration;
import com.becon.opencelium.backend.utility.ApplicationContextUtility;
import com.becon.opencelium.backend.utility.LogFileUtility;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;

import java.nio.file.Path;
import java.util.function.Consumer;

public class OcLogger<T extends LogMessage> {
    private final boolean debugMode;
    private final boolean log2File;
    private final boolean webSocket;
    private final T logEntity;
    private final WebSocketNotificationService socketNotificationService;
    private final long executionId;
    private final long connectionId;
    private final Logger logger;

    public static final String LOG_LOCATION = "src/main/resources/logs";

    public OcLogger(LoggerConfiguration loggerConfiguration, T logEntity,
                    long connectionId, String timestamp, long executionId, Class<?> c) {
        this.debugMode = loggerConfiguration.isDebugMode();
        this.log2File = loggerConfiguration.isLog2File();
        this.webSocket = loggerConfiguration.isWSocketOpen();

        this.socketNotificationService = ApplicationContextUtility.getBean(WebSocketNotificationService.class);
        this.executionId = executionId;
        this.connectionId = connectionId;
        this.logEntity = logEntity;

        if (log2File && debugMode) {
            String loggerId = String.format("%d-%d", executionId, connectionId);
            String filename = LogFileUtility.toFilename(timestamp, connectionId, "u", executionId, "log");

            // create temporary log file in base log directory: type = u (uncategorized), not s (success) or f (fail):
            Path filePath = LogFileUtility.toPath(LOG_LOCATION, filename);
            LoggerContext context = (LoggerContext) LoggerFactory.getILoggerFactory();
            FileAppender<ILoggingEvent> fileAppender = new FileAppender<>();
            fileAppender.setName("FileAppender-" + loggerId);
            fileAppender.setContext(context);
            fileAppender.setFile(filePath.toString());

            PatternLayoutEncoder encoder = new PatternLayoutEncoder();
            encoder.setContext(context);
            encoder.setPattern("%d{dd-MM-yyyy HH:mm:ss.SSS} %highlight(%-5level) - %msg%n");
            encoder.start();

            fileAppender.setEncoder(encoder);
            fileAppender.start();

            ch.qos.logback.classic.Logger logger = (ch.qos.logback.classic.Logger) LoggerFactory.getLogger(loggerId);
            logger.addAppender(fileAppender);
            logger.setAdditive(false); // do not pass message to parent, just write to the file

            this.logger = logger;
        } else {
            this.logger = LoggerFactory.getLogger(c);
        }

        logAndSend(String.format("phase=EXECUTION_START id=%d connectionId=%d", executionId, connectionId));
    }

    public void close() {
        logAndSend(String.format("phase=EXECUTION_END id=%d connectionId=%d", executionId, connectionId));

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

        if (log2File) {
            t.accept(message);
            return;
        }

        if (webSocket) {
            logEntity.setMessage(message);
            socketNotificationService.send(connectionId, logEntity);
        } else {
            t.accept(message);
        }
    }
}
