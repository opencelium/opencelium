package com.becon.opencelium.backend.logger;

import com.becon.opencelium.backend.enums.LogType;
import com.becon.opencelium.backend.execution.log.msg.LogMessage;
import com.becon.opencelium.backend.execution.socket.SocketConstant;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.messaging.simp.SimpMessagingTemplate;

import java.util.function.Consumer;

public class OcLogger<T extends LogMessage> {
    private boolean isWebsocket; // if true then sends logs through websocket;
    private boolean enable = true; // if false then disables logs;
    private final T logEntity; // log entity
    private final SimpMessagingTemplate simpMessagingTemplate; // sends messages to user via websocket
    private final Logger logger;

    public OcLogger(boolean isWebsocket, SimpMessagingTemplate simpMessagingTemplate, T logEntity, Class<?> c) {
        this.logger = LoggerFactory.getLogger(c);
        this.isWebsocket = isWebsocket;
        this.simpMessagingTemplate = simpMessagingTemplate;
        this.logEntity = logEntity;
    }

    public boolean isWebsocket() {
        return isWebsocket;
    }

    public void setWebsocket(boolean websocket) {
        isWebsocket = websocket;
    }

    public T getLogEntity() {
        return logEntity;
    }

    public OcLogger<T> disable() {
        enable = false;
        return this;
    }

    public OcLogger<T> enable() {
        enable = true;
        return this;
    }

    public void logAndSend(Exception e){
        Consumer<Exception> printStrategy = x -> {
            logger.error(e.getMessage());
            e.printStackTrace();
        };
        logAndSend(printStrategy, e);
    }

    public void logAndSend(String message){
        Consumer<String> printStrategy = logger::info;
        logAndSend(printStrategy, message);
    }

    public void logAndSend(Exception e, LogType type){
        logEntity.setType(type);
        logAndSend(e);
    }

    public void logAndSend(String message, LogType type){
        logEntity.setType(type);
        logAndSend(message);
    }

    private <E> void logAndSend(Consumer<E> t, E message) {
        if (!enable) {
            return;
        }
        if (isWebsocket) {
            logEntity.setMessage(message);
            simpMessagingTemplate.convertAndSend(SocketConstant.DESTINATION, logEntity);
        } else {
            t.accept(message);
        }
    }
}
