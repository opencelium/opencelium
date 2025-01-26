package com.becon.opencelium.backend.oc997;

import ch.qos.logback.classic.LoggerContext;
import ch.qos.logback.classic.encoder.PatternLayoutEncoder;
import ch.qos.logback.classic.spi.ILoggingEvent;
import ch.qos.logback.core.FileAppender;
import com.becon.opencelium.backend.execution.logger.LogMessage;
import com.becon.opencelium.backend.execution.socket.SocketConstant;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.messaging.simp.SimpMessagingTemplate;

import java.io.IOException;
import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.Paths;
import java.util.function.Consumer;

public class NewLogger<T extends LogMessage> {
    private boolean isWebsocket; // if true then sends logs through websocket;
    private boolean enable = true; // if false then disables logs;
    private final T logEntity; // log entity
    private final SimpMessagingTemplate simpMessagingTemplate; // sends messages to user via websocket
    private final Logger logger;

    public static final String LOG_LOCATION = "src/main/resources/logs";
    static {
        try {
            Path path = getPath();

            if (!Files.exists(path)) {
                Files.createDirectories(path);
            }
        } catch (IOException e) {
            throw new RuntimeException(e);
        }
    }

    public NewLogger(boolean isWebsocket, SimpMessagingTemplate simpMessagingTemplate, T logEntity, Long connectionId, long timestamp) {
        this.isWebsocket = isWebsocket;
        this.simpMessagingTemplate = simpMessagingTemplate;
        this.logEntity = logEntity;

        // setup logger to create separate files:
        String id = String.format("%d-%d", connectionId, timestamp);

        Path filePath = getPath(String.format("%d_%d.log", connectionId, timestamp));
        LoggerContext context = (LoggerContext) LoggerFactory.getILoggerFactory();
        FileAppender<ILoggingEvent> fileAppender = new FileAppender<>();
        fileAppender.setName("FileAppender-" + id);
        fileAppender.setContext(context);
        fileAppender.setFile(filePath.toString());

        PatternLayoutEncoder encoder = new PatternLayoutEncoder();
        encoder.setContext(context);
        encoder.setPattern("%d{dd-MM-yyyy HH:mm:ss.SSS} %highlight(%-5level) - %msg%n");
        encoder.start();

        fileAppender.setEncoder(encoder);
        fileAppender.start();

        ch.qos.logback.classic.Logger logger = (ch.qos.logback.classic.Logger) LoggerFactory.getLogger("Logger-" + id);
        logger.addAppender(fileAppender);
        logger.setAdditive(true);

        this.logger = logger;
    }

    public T getLogEntity() {
        return logEntity;
    }

    public NewLogger<T> disable() {
        enable = false;
        return this;
    }

    public NewLogger<T> enable() {
        enable = true;
        return this;
    }

    public void logAndSend(String message){
        Consumer<String> printStrategy = logger::info;
        logAndSend(printStrategy, message);
    }

    private <E> void logAndSend(Consumer<E> t, E message) {
        if (!enable) {
            return;
        }
        t.accept(message);

        if (isWebsocket) {
            logEntity.setMessage(message);
            simpMessagingTemplate.convertAndSend(SocketConstant.DESTINATION, logEntity);
        }
    }

    private static Path getPath(String... sub) {
        // Returns absolute path to base directory and/or its subdirectories
        Path path = Paths.get(LOG_LOCATION, sub);
        return path.isAbsolute() ? path : Paths.get(System.getProperty("user.dir")).resolve(path).normalize();
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
    }
}
