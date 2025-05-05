package com.becon.opencelium.backend.execution.socket.handler;

import com.becon.opencelium.backend.execution.socket.WebSocketNotificationService;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.context.annotation.Lazy;
import org.springframework.messaging.simp.stomp.StompHeaderAccessor;
import org.springframework.stereotype.Component;

@Component
public class SupportFileWebSocketHandler implements WebSocketEventHandler {
    private final WebSocketNotificationService webSocketNotificationService;
    private static final Logger logger = LoggerFactory.getLogger(SupportFileWebSocketHandler.class);

    public SupportFileWebSocketHandler(@Lazy WebSocketNotificationService webSocketNotificationService) {
        this.webSocketNotificationService = webSocketNotificationService;
    }

    @Override
    public WebSocketHandlerType getEventType() {
        return WebSocketHandlerType.SUPPORT_FILE;
    }

    @Override
    public void handleConnect(StompHeaderAccessor accessor) {
        String sessionId = accessor.getSessionId();
        Object value = accessor.getSessionAttributes().get("supportFile");

        if (Boolean.TRUE.equals(value)) {
            webSocketNotificationService.setOpen(true);
            logger.info("Support file generation event registered for WebSocket session " + sessionId);
        } else {
            logger.warn("Could not find support file generation events' session attribute");
        }
    }

    @Override
    public void handleDisconnect(StompHeaderAccessor accessor) {
        String sessionId = accessor.getSessionId();
        webSocketNotificationService.setOpen(false);
        logger.info("Support file generation event unregistered from WebSocket session " + sessionId);
    }
}
