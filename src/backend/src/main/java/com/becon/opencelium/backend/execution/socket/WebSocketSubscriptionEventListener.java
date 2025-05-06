package com.becon.opencelium.backend.execution.socket;

import org.springframework.context.event.EventListener;
import org.springframework.messaging.simp.stomp.StompHeaderAccessor;
import org.springframework.stereotype.Component;
import org.springframework.web.socket.messaging.SessionDisconnectEvent;
import org.springframework.web.socket.messaging.SessionSubscribeEvent;

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
        String destination = accessor.getDestination();
        Integer userId = (Integer) accessor.getSessionAttributes().get("userId");

        if (destination != null) {
            userSubscriptionRegistry.add(userId, destination);
            notificationQueue.check(destination);
        }
    }

    @EventListener
    public void handleDisconnectEvent(SessionDisconnectEvent event) {
        StompHeaderAccessor accessor = StompHeaderAccessor.wrap(event.getMessage());
        String destination = accessor.getDestination();
        Integer userId = (Integer) accessor.getSessionAttributes().get("userId");

        if (destination != null) {
            userSubscriptionRegistry.remove(userId, destination);
        } else {
            userSubscriptionRegistry.remove(userId);
        }
    }
}
