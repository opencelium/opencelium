package com.becon.opencelium.backend.execution.socket;

import org.springframework.context.event.EventListener;
import org.springframework.messaging.simp.stomp.StompHeaderAccessor;
import org.springframework.stereotype.Component;
import org.springframework.web.socket.messaging.SessionDisconnectEvent;
import org.springframework.web.socket.messaging.SessionSubscribeEvent;

import java.security.Principal;

@Component
public class WebSocketSubscriptionEventListener {
    private final WebSocketUserSubscriptionRegistry userSubscriptionRegistry;
    private final WebSocketNotificationQueue notificationQueue;

    public WebSocketSubscriptionEventListener(
            WebSocketUserSubscriptionRegistry userSubscriptionRegistry,
            WebSocketNotificationQueue notificationQueue) {
        this.userSubscriptionRegistry = userSubscriptionRegistry;
        this.notificationQueue = notificationQueue;
    }

    @EventListener
    public void handleSubscribeEvent(SessionSubscribeEvent event) {
        StompHeaderAccessor accessor = StompHeaderAccessor.wrap(event.getMessage());
        Principal principal = accessor.getUser();
        String destination = accessor.getDestination();

        if (principal != null && destination != null) {
            userSubscriptionRegistry.add(principal.getName(), destination);
            notificationQueue.check(principal.getName());
        }
    }

    @EventListener
    public void handleDisconnectEvent(SessionDisconnectEvent event) {
        StompHeaderAccessor accessor = StompHeaderAccessor.wrap(event.getMessage());
        Principal principal = accessor.getUser();

        if (principal != null) {
            userSubscriptionRegistry.remove(principal.getName());
        }
    }
}
