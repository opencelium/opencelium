package com.becon.opencelium.backend.execution.logger;

import ch.qos.logback.classic.LoggerContext;
import ch.qos.logback.classic.encoder.PatternLayoutEncoder;
import ch.qos.logback.classic.spi.ILoggingEvent;
import ch.qos.logback.core.FileAppender;
import com.becon.opencelium.backend.execution.socket.SocketConstant;
import com.becon.opencelium.backend.resource.execution.LoggerConfiguration;
import com.becon.opencelium.backend.utility.FileUtility;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.messaging.simp.SimpMessagingTemplate;

import java.nio.file.Path;
import java.util.function.Consumer;

public class OcLogger<T extends LogMessage> {
    private final boolean debugMode;
    private final boolean log2File;
    private final boolean webSocket; // if true then sends logs through websocket;
    private final T logEntity; // log entity
    private final SimpMessagingTemplate simpMessagingTemplate; // sends messages to user via websocket
    private final Logger logger;
    private boolean executionFailed = false;

    public static final String LOG_LOCATION = "src/main/resources/logs";

    public OcLogger(
            LoggerConfiguration loggerConfiguration, T logEntity, SimpMessagingTemplate simpMessagingTemplate,
            long connectionId, String timestamp, long executionId, Class<?> c
            ) {
        this.debugMode = loggerConfiguration.isDebugMode();
        this.log2File = loggerConfiguration.isLog2File();
        this.webSocket = loggerConfiguration.isWSocketOpen();

        this.simpMessagingTemplate = simpMessagingTemplate;
        this.logEntity = logEntity;

        if (log2File) {
            String loggerId = String.format("%d-%d", executionId, connectionId);
            String filename = timestamp + "_" + connectionId + "_" + executionId + ".log";

            // setup loggerConfiguration to create separate files:
            Path filePath = FileUtility.toPath(LOG_LOCATION, filename);
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

            logAndSend("------------------- PRE --------------------");
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

            return;
        }

        if (executionFailed) {
            logAndSend("------------------- EXCEPTION --------------------");
        } else {
            logAndSend("------------------- POST --------------------");
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
        this.executionFailed = true;

        Consumer<Exception> printStrategy = x -> {
            logger.error(e.getMessage(), e);
        };

        logAndSend(printStrategy, e);
    }


    private <E> void logAndSend(Consumer<E> t, E message) {
        if (log2File) {
            t.accept(message);
            return;
        }

        if (!debugMode) {
            return;
        }

        if (webSocket) {
            logEntity.setMessage(message);
            simpMessagingTemplate.convertAndSend(SocketConstant.DESTINATION_EXECUTION_LOG, logEntity);
        } else {
            t.accept(message);
        }
    }
}
