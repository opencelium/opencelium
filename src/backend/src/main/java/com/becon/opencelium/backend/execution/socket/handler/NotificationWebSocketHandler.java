package com.becon.opencelium.backend.execution.socket.handler;

import com.becon.opencelium.backend.execution.socket.WebSocketSessionRegistry;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.messaging.simp.stomp.StompHeaderAccessor;
import org.springframework.stereotype.Component;

@Component
public class NotificationWebSocketHandler implements WebSocketEventHandler {
    private final WebSocketSessionRegistry registry;
    private static final Logger logger = LoggerFactory.getLogger(NotificationWebSocketHandler.class);

    public NotificationWebSocketHandler(WebSocketSessionRegistry registry) {
        this.registry = registry;
    }

    @Override
    public void handleConnect(StompHeaderAccessor accessor) {
        String sessionId = accessor.getSessionId();
        Integer userId = (Integer) accessor.getSessionAttributes().get("userId");
        String username = (String) accessor.getSessionAttributes().get("username");

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
            registry.addUsername(userId, username);
            logger.info("WebSocket session has been registered, userId = " + userId + ", sessionId = " + sessionId);
        }
    }

    @Override
    public void handleDisconnect(StompHeaderAccessor accessor) {
        String sessionId = accessor.getSessionId();
        Integer userId = (Integer) accessor.getSessionAttributes().get("userId");

        boolean unregistered = registry.unregister(userId, sessionId);

        if (unregistered) {
            logger.info("WebSocket session has been unregistered, userId = " + userId + ", sessionId = " + sessionId);
        }
    }
}
