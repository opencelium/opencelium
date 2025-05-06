package com.becon.opencelium.backend.execution.socket;

import org.springframework.stereotype.Component;

import java.util.Map;
import java.util.Queue;
import java.util.concurrent.ConcurrentHashMap;
import java.util.concurrent.ConcurrentLinkedQueue;

@Component
public class WebSocketNotificationQueue {
    private final Map<String, Queue<String>> destinationMessages = new ConcurrentHashMap<>();
    private final WebSocketUserSubscriptionRegistry subscriptionRegistry;
    private final WebSocketNotificationService notificationService;

    public WebSocketNotificationQueue(
            WebSocketUserSubscriptionRegistry subscriptionRegistry,
            WebSocketNotificationService notificationService) {
        this.subscriptionRegistry = subscriptionRegistry;
        this.notificationService = notificationService;
    }

    public void addMessage(String destination, String message) {
        destinationMessages
                .computeIfAbsent(destination, dest -> new ConcurrentLinkedQueue<>())
                .offer(message);

        // if there is a message for specific destination then send it
        while (subscriptionRegistry.hasSubscription(destination) && (hasMessages(destination))){
            notificationService.send(destination, getMessage(destination));
        }
    }

    public String getMessage(String destination) {
        Queue<String> messages = destinationMessages.get(destination);
        return (messages != null) ? messages.poll() : null;
    }

    public boolean hasMessages(String destination) {
        Queue<String> queue = destinationMessages.get(destination);
        return queue != null && !queue.isEmpty();
    }

    public void check(String destination) {
        // if there is a message for specific destination then send it
        while (subscriptionRegistry.hasSubscription(destination) && (hasMessages(destination))){
            notificationService.send(destination, getMessage(destination));
        }
    }
}
