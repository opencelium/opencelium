package com.becon.opencelium.backend.execution.socket.handler;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.messaging.simp.stomp.StompHeaderAccessor;
import org.springframework.stereotype.Component;

@Component
public class SupportFileWebSocketHandler implements WebSocketEventHandler {
    private static final Logger logger = LoggerFactory.getLogger(SupportFileWebSocketHandler.class);

    @Override
    public WebSocketHandlerType getEventType() {
        return WebSocketHandlerType.SUPPORT_FILE;
    }

    @Override
    public void handleConnect(StompHeaderAccessor accessor) {
        String sessionId = accessor.getSessionId();
        Object value = accessor.getSessionAttributes().get("supportFile");

        if (Boolean.TRUE.equals(value)) {
            logger.info("Support file generation event registered for WebSocket session " + sessionId);
        } else {
            logger.warn("Could not find support file generation events' session attribute");
        }
    }

    @Override
    public void handleDisconnect(StompHeaderAccessor accessor) {
        String sessionId = accessor.getSessionId();
        logger.info("Support file generation event unregistered from WebSocket session " + sessionId);
    }
}
