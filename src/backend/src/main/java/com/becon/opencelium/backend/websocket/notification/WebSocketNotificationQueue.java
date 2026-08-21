package com.becon.opencelium.backend.websocket.notification;

import com.becon.opencelium.backend.websocket.WebSocketNotificationService;
import com.becon.opencelium.backend.websocket.subscription.WebSocketSubscriptionRegistry;
import org.springframework.stereotype.Component;

import java.util.Map;
import java.util.Queue;
import java.util.concurrent.ConcurrentHashMap;
import java.util.concurrent.ConcurrentLinkedQueue;

@Component
public class WebSocketNotificationQueue {
    private final Map<String, Queue<Object>> destinationMessages = new ConcurrentHashMap<>();
    private final WebSocketSubscriptionRegistry subscriptionRegistry;
    private final WebSocketNotificationService notificationService;

    public WebSocketNotificationQueue(
            WebSocketSubscriptionRegistry subscriptionRegistry,
            WebSocketNotificationService notificationService) {
        this.subscriptionRegistry = subscriptionRegistry;
        this.notificationService = notificationService;
    }

    public void addMessage(String destination, Object message) {
        destinationMessages
                .computeIfAbsent(destination, dest -> new ConcurrentLinkedQueue<>())
                .offer(message);

        // if there is a message for specific destination then send it
        while (subscriptionRegistry.hasSubscription(destination) && (hasMessage(destination))){
            notificationService.send(destination, getMessage(destination));
        }
    }

    public Object getMessage(String destination) {
        Queue<Object> messages = destinationMessages.get(destination);
        return (messages != null) ? messages.poll() : null;
    }

    public boolean hasMessage(String destination) {
        Queue<Object> queue = destinationMessages.get(destination);
        return queue != null && !queue.isEmpty();
    }

    public void check(String destination) {
        // if there is a message for specific destination then send it
        while (subscriptionRegistry.hasSubscription(destination) && (hasMessage(destination))){
            notificationService.send(destination, getMessage(destination));
        }
    }
}
