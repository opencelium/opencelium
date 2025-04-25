package com.becon.opencelium.backend.execution.socket;

import org.springframework.messaging.simp.SimpMessagingTemplate;
import org.springframework.stereotype.Component;

@Component
public class WebSocketNotificationService {
    private final SimpMessagingTemplate simpMessagingTemplate;
    private boolean open = false;

    public WebSocketNotificationService(SimpMessagingTemplate simpMessagingTemplate) {
        this.simpMessagingTemplate = simpMessagingTemplate;
    }

    public void setOpen(boolean open) {
        this.open = open;
    }

    public <E> void send(String destination, E message) {
        if (open) {
            simpMessagingTemplate.convertAndSend(destination, message);
        }
    }
}
