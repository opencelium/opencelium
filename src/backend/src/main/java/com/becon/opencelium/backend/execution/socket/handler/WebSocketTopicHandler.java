package com.becon.opencelium.backend.execution.socket.handler;

import org.springframework.messaging.simp.stomp.StompHeaderAccessor;

public interface WebSocketTopicHandler {
    WebSocketTopicType getEventType(); // Identify handler type
    void handleConnect(StompHeaderAccessor accessor);
    void handleDisconnect(StompHeaderAccessor accessor);
}
