package com.becon.opencelium.backend.oc997;

import ch.qos.logback.classic.LoggerContext;
import ch.qos.logback.classic.encoder.PatternLayoutEncoder;
import ch.qos.logback.classic.spi.ILoggingEvent;
import ch.qos.logback.core.FileAppender;
import com.becon.opencelium.backend.database.mysql.entity.MaskingRule;
import com.becon.opencelium.backend.execution.logger.LogMessage;
import com.becon.opencelium.backend.execution.socket.SocketConstant;
import com.becon.opencelium.backend.utility.FileUtility;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.messaging.simp.SimpMessagingTemplate;

import java.nio.file.Path;
import java.util.List;
import java.util.function.Consumer;

public class NewLogger<T extends LogMessage> {
    private boolean isWebsocket; // if true then sends logs through websocket;
    private boolean enable = true; // if false then disables logs;
    private final T logEntity; // log entity
    private final List<MaskingRule> rules;
    private final SimpMessagingTemplate simpMessagingTemplate; // sends messages to user via websocket
    private final Logger logger;

    public static final String LOG_LOCATION = "src/main/resources/logs";

    public NewLogger(boolean isWebsocket, SimpMessagingTemplate simpMessagingTemplate, T logEntity, List<MaskingRule> rules, String loggerId) {
        this.isWebsocket = isWebsocket;
        this.simpMessagingTemplate = simpMessagingTemplate;
        this.logEntity = logEntity;
        this.rules = rules;

        // setup logger to create separate files:
        Path filePath = FileUtility.toPath(LOG_LOCATION, loggerId + ".log");
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

        ch.qos.logback.classic.Logger logger = (ch.qos.logback.classic.Logger) LoggerFactory.getLogger("NewLogger-" + loggerId);
        logger.addAppender(fileAppender);
        logger.setAdditive(true);

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
}
