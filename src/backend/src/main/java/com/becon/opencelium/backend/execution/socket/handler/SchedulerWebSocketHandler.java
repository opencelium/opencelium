package com.becon.opencelium.backend.execution.socket.handler;

import com.becon.opencelium.backend.execution.socket.SchedulerRegisterSession;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.messaging.simp.stomp.StompHeaderAccessor;
import org.springframework.stereotype.Component;

@Component
public class SchedulerWebSocketHandler implements WebSocketEventHandler {

    // Service used to register and deregister scheduler sessions.
    private final SchedulerRegisterSession schedulerRegisterSession;
    private static final Logger logger = LoggerFactory.getLogger(SchedulerWebSocketHandler.class);

    public SchedulerWebSocketHandler(SchedulerRegisterSession schedulerRegisterSession) {
        this.schedulerRegisterSession = schedulerRegisterSession;
    }

    @Override
    public WebSocketHandlerType getEventType() {
        return WebSocketHandlerType.SCHEDULER;
    }

    /**
     * Handles the CONNECT event for a scheduler WebSocket connection.
     * <p>
     * It retrieves the scheduler ID from the session attributes (populated during the handshake)
     * and registers the scheduler using the schedulerRegisterSession service.
     *
     * @param accessor the STOMP header accessor containing connection details.
     */
    @Override
    public void handleConnect(StompHeaderAccessor accessor) {
        String sessionId = accessor.getSessionId();
        Integer schedulerId = (Integer) accessor.getSessionAttributes().get("schedulerId");
        if (schedulerId != null) {
            schedulerRegisterSession.addScheduler(schedulerId); // Add schedulerId
            logger.info("Scheduler ID " + schedulerId + " registered for WebSocket session " + sessionId);
        } else {
            logger.warn("No scheduler ID found for session: " + sessionId);
        }
    }

    /**
     * Handles the DISCONNECT event for a scheduler WebSocket connection.
     * <p>
     * It retrieves the scheduler ID from the session attributes and deregisters the scheduler,
     * ensuring proper cleanup when the connection is closed.
     *
     * @param accessor the STOMP header accessor containing connection details.
     */
    @Override
    public void handleDisconnect(StompHeaderAccessor accessor) {
        String sessionId = accessor.getSessionId();
        Integer schedulerId = (Integer) accessor.getSessionAttributes().get("schedulerId");
        if (schedulerId != null) {
            schedulerRegisterSession.removeScheduler(schedulerId); //Remove schedulerId
            logger.info("Scheduler ID " + schedulerId + " removed from WebSocket session " + sessionId);
        }
    }
}
