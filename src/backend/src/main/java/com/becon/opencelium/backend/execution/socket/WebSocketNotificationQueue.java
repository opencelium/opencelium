package com.becon.opencelium.backend.execution.socket;

import org.springframework.stereotype.Component;

import java.util.Map;
import java.util.Queue;
import java.util.concurrent.ConcurrentHashMap;
import java.util.concurrent.ConcurrentLinkedQueue;

@Component
public class WebSocketNotificationQueue {
    private final Map<Integer, Queue<String>> userNotifications = new ConcurrentHashMap<>();
    private final WebSocketSessionRegistry sessionRegistry;
    private final WebSocketUserSubscriptionRegistry subscriptionRegistry;
    private final WebSocketNotificationService notificationService;

    public WebSocketNotificationQueue(
            WebSocketSessionRegistry sessionRegistry,
            WebSocketUserSubscriptionRegistry subscriptionRegistry,
            WebSocketNotificationService notificationService) {
        this.sessionRegistry = sessionRegistry;
        this.subscriptionRegistry = subscriptionRegistry;
        this.notificationService = notificationService;
    }

    public void addMessage(int userId, String message) {
        String username = sessionRegistry.getUsername(userId);

        userNotifications
                .computeIfAbsent(userId, id -> new ConcurrentLinkedQueue<>())
                .offer(message);

        // if user is subscribed then send messages
        while (subscriptionRegistry.isSubscribed(username, SocketConstant.NOTIFICATION_DESTINATION) && (hasMessages(userId))){
            notificationService.send2User(username, SocketConstant.NOTIFICATION_DESTINATION, getMessage(userId));
        }
    }

    public String getMessage(int userId) {
        Queue<String> messages = userNotifications.get(userId);
        return (messages != null) ? messages.poll() : null;
    }

    public boolean hasMessages(int userId) {
        Queue<String> queue = userNotifications.get(userId);
        return queue != null && !queue.isEmpty();
    }

    public void check(String username) {
        int userId = sessionRegistry.getUserId(username);

        while (subscriptionRegistry.isSubscribed(username, SocketConstant.NOTIFICATION_DESTINATION) && (hasMessages(userId))){
            notificationService.send2User(username, SocketConstant.NOTIFICATION_DESTINATION, getMessage(userId));
        }
    }
}
