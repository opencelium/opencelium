package com.becon.opencelium.backend.execution.socket;

import org.springframework.messaging.simp.SimpMessagingTemplate;
import org.springframework.stereotype.Component;

@Component
public class WebSocketNotificationService {
    private final SimpMessagingTemplate simpMessagingTemplate;
    private boolean on = false;

    public WebSocketNotificationService(SimpMessagingTemplate simpMessagingTemplate) {
        this.simpMessagingTemplate = simpMessagingTemplate;
    }

    public void setOn() {
        this.on = true;
    }

    public void setOff() {
        this.on = false;
    }

    public <E> void send(String destination, E message) {
        if (on) {
            simpMessagingTemplate.convertAndSend(destination, message);
        }
    }
}
