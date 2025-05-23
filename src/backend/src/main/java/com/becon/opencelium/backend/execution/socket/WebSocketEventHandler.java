package com.becon.opencelium.backend.execution.socket;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.context.annotation.Lazy;
import org.springframework.messaging.simp.SimpMessagingTemplate;
import org.springframework.messaging.simp.stomp.StompHeaderAccessor;
import org.springframework.stereotype.Component;

import java.util.HashSet;
import java.util.Map;
import java.util.Objects;
import java.util.Set;
import java.util.concurrent.ConcurrentHashMap;

import static com.becon.opencelium.backend.execution.socket.SocketConstant.USER_SESSION_DESTINATION;

@Component
public class WebSocketEventHandler {
    private final Map<Integer, Connection> connections = new ConcurrentHashMap<>();
    private final SimpMessagingTemplate messagingTemplate;
    private static final Logger logger = LoggerFactory.getLogger(WebSocketEventHandler.class);

    public WebSocketEventHandler(@Lazy SimpMessagingTemplate messagingTemplate) {
        this.messagingTemplate = messagingTemplate;
    }

    public void handleConnect(StompHeaderAccessor accessor) {
        Integer userId = (Integer) accessor.getSessionAttributes().get("userId");
        String principal = (String) accessor.getSessionAttributes().get("principal");
        String wsSessionId = accessor.getSessionId();
        String ocSessionId = (String) accessor.getSessionAttributes().get("ocSessionId");

        if (userId == null || wsSessionId == null) {
            logger.error("Missing userId or wsSessionId in STOMP headers.");
            throw new IllegalArgumentException("Missing userId or wsSessionId in STOMP headers.");
        }

        if (connections.containsKey(userId)) {
            Connection existing = connections.get(userId);

            if (Objects.equals(ocSessionId, existing.ocSessionId)) {
                existing.addSession(wsSessionId);
                logger.info("WebSocket connection has been added, userId = {}, wsSessionId = {}", userId, wsSessionId);

                return;
            } else {
                messagingTemplate.convertAndSendToUser(existing.principal, USER_SESSION_DESTINATION, Event.of("FORCE_LOGOUT", "New login detected"));
                connections.remove(userId);
                logger.info("WebSocket connections have been unregistered, userId = {}, wsSessionIds = {}", userId, existing.wsSessionIds);
            }
        }

        Connection connection = new Connection(principal, ocSessionId, wsSessionId);
        connections.put(userId, connection);
        logger.info("WebSocket connection has been established, userId = {}, wsSessionId = {}", userId, wsSessionId);
    }

    public void handleDisconnect(StompHeaderAccessor accessor) {
        Integer userId = (Integer) accessor.getSessionAttributes().get("userId");
        String wsSessionId = accessor.getSessionId();

        if (connections.containsKey(userId)) {
            if (connections.get(userId).removeSession(wsSessionId)) {
                logger.info("WebSocket connection has been unregistered, userId = {}, wsSessionId = {}", userId, wsSessionId);
            }

            if (connections.get(userId).wsSessionIds.isEmpty()) {
                // if no web socket sessions left then remove connection
                connections.remove(userId);
            }
        }
    }

    private class Connection {
        private final String principal;
        private final String ocSessionId;
        private final Set<String> wsSessionIds = new HashSet<>();

        public Connection(String principal, String ocSessionId, String wsSessionId) {
            this.principal = principal;
            this.ocSessionId = ocSessionId;
            this.wsSessionIds.add(wsSessionId);
        }

        void addSession(String wsSessionId) {
            this.wsSessionIds.add(wsSessionId);
        }

        boolean removeSession(String wsSession) {
            return this.wsSessionIds.remove(wsSession);
        }
    }
}
