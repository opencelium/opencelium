package com.becon.opencelium.backend.execution.socket;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.messaging.simp.SimpMessagingTemplate;
import org.springframework.messaging.simp.stomp.StompHeaderAccessor;
import org.springframework.stereotype.Component;

import java.util.Map;
import java.util.Objects;
import java.util.concurrent.ConcurrentHashMap;

@Component
public class WebSocketEventHandler {
    private final Map<Integer, Session> sessions = new ConcurrentHashMap<>();
    private final SimpMessagingTemplate messagingTemplate;
    private static final Logger logger = LoggerFactory.getLogger(WebSocketEventHandler.class);

    public WebSocketEventHandler(SimpMessagingTemplate messagingTemplate) {
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

        Session potential = Session.of(principal, wsSessionId, ocSessionId);
        if (sessions.containsKey(userId)) {
            Session existing = sessions.get(userId);

            if (potential.equals(existing)) {
                String message = "WebSocket session already active for userId = " + userId + ", wsSessionId = " + wsSessionId;

                logger.warn(message);
                throw new IllegalStateException(message);
            } else {
                messagingTemplate.convertAndSendToUser(principal, "/session", Event.of("FORCE_LOGOUT", "New login detected"));
                sessions.remove(userId);
                logger.info("Existing WebSocket session has been found, userId = " + userId + ", wsSessionId = " + existing.wsSessionId);
            }
        }

        // register new Session for user
        sessions.put(userId, potential);
        logger.info("WebSocket session has been registered, userId = " + userId + ", wsSessionId = " + wsSessionId);
    }

    public void handleDisconnect(StompHeaderAccessor accessor) {
        Integer userId = (Integer) accessor.getSessionAttributes().get("userId");
        String wsSessionId = accessor.getSessionId();

        if (sessions.containsKey(userId)) {
            sessions.remove(userId);
            logger.info("WebSocket session has been unregistered, userId = " + userId + ", wsSessionId = " + wsSessionId);
        }
    }


    private record Session(String principal, String wsSessionId, String ocSessionId) {
        static Session of(String principal, String wsSessionId, String ocSessionId) {
            return new Session(principal, wsSessionId, ocSessionId);
        }

        @Override
        public boolean equals(Object o) {
            if (this == o) return true;
            if (!(o instanceof Session session)) return false;
            return Objects.equals(principal, session.principal) && Objects.equals(ocSessionId, session.ocSessionId);
        }

    }

    private record Event(String event, String reason){
        static Event of(String event, String reason) {
            return new Event(event, reason);
        }
    }
}
