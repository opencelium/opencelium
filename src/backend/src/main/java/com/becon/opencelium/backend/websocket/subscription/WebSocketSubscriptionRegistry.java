package com.becon.opencelium.backend.websocket.subscription;

import org.springframework.stereotype.Component;

import java.util.Map;
import java.util.Set;
import java.util.concurrent.ConcurrentHashMap;

@Component
public class WebSocketSubscriptionRegistry {
    private final Map<Integer, Set<String>> userSubscriptions = new ConcurrentHashMap<>();

    public synchronized boolean add(int userId, String destination) {
        return userSubscriptions
                .computeIfAbsent(userId, k -> ConcurrentHashMap.newKeySet())
                .add(destination);
    }

    public void remove(int userId, String destination) {
        userSubscriptions.get(userId).remove(destination);
    }

    public void remove(int userId) {
        userSubscriptions.remove(userId);
    }

    public boolean hasSubscription(String destination) {
        return userSubscriptions.values().stream()
                .anyMatch(set -> set.contains(destination));
    }
}
