package com.becon.opencelium.backend.execution.socket.handler;

import com.becon.opencelium.backend.execution.socket.WebSocketNotificationService;
import com.becon.opencelium.backend.execution.socket.WebSocketSessionRegistry;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.context.annotation.Lazy;
import org.springframework.messaging.simp.stomp.StompHeaderAccessor;
import org.springframework.stereotype.Component;

@Component
public class NotificationWebSocketHandler implements WebSocketEventHandler {
    private final WebSocketSessionRegistry registry;
    private final WebSocketNotificationService notificationService;
    private static final Logger logger = LoggerFactory.getLogger(NotificationWebSocketHandler.class);

    public NotificationWebSocketHandler(WebSocketSessionRegistry registry, @Lazy WebSocketNotificationService notificationService) {
        this.registry = registry;
        this.notificationService = notificationService;
    }

    @Override
    public void handleConnect(StompHeaderAccessor accessor) {
        String sessionId = accessor.getSessionId();
        Integer userId = (Integer) accessor.getSessionAttributes().get("userId");

        if (userId == null || sessionId == null) {
            logger.error("Missing userId or sessionId in STOMP headers.");
            throw new IllegalArgumentException("Missing userId or sessionId in STOMP headers.");
        }

        boolean registered = registry.register(userId, sessionId);
        if (!registered) {
            String message = "WebSocket session already active for userId = " + userId + ", sessionId = " + sessionId;

            logger.warn(message);
            throw new IllegalStateException(message);
        } else {
            notificationService.setOn();
            logger.info("WebSocket session has been registered, userId = " + userId + ", sessionId = " + sessionId);
        }
    }

    @Override
    public void handleDisconnect(StompHeaderAccessor accessor) {
        String sessionId = accessor.getSessionId();
        Integer userId = (Integer) accessor.getSessionAttributes().get("userId");

        boolean unregistered = registry.unregister(userId, sessionId);

        if (unregistered) {
            notificationService.setOff();
            logger.info("WebSocket session has been unregistered, userId = " + userId + ", sessionId = " + sessionId);
        }
    }
}
