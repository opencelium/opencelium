package com.becon.opencelium.backend.execution.socket.handler;

import org.springframework.messaging.simp.stomp.StompHeaderAccessor;

public interface WebSocketEventHandler {
    void handleConnect(StompHeaderAccessor accessor);
    void handleDisconnect(StompHeaderAccessor accessor);
}
