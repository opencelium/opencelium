package com.becon.opencelium.backend.execution.socket.handler;

import com.becon.opencelium.backend.configuration.WebSocketConfig;
import com.becon.opencelium.backend.execution.socket.SchedulerRegisterSession;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.messaging.simp.stomp.StompHeaderAccessor;
import org.springframework.stereotype.Component;

@Component
public class SchedulerWebSocketHandler implements WebSocketTopicHandler {

    private final SchedulerRegisterSession schedulerRegisterSession;
    private static final Logger logger = LoggerFactory.getLogger(SchedulerWebSocketHandler.class);

    public SchedulerWebSocketHandler(SchedulerRegisterSession schedulerRegisterSession) {
        this.schedulerRegisterSession = schedulerRegisterSession;
    }

    @Override
    public WebSocketTopicType getEventType() {
        return WebSocketTopicType.SCHEDULER;
    }

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
