package com.becon.opencelium.backend.execution.socket;

import org.springframework.stereotype.Component;

import java.util.Map;
import java.util.Set;
import java.util.concurrent.ConcurrentHashMap;

@Component
public class WebSocketUserSubscriptionRegistry {
    private final Map<String, Set<String>> userSubscriptions = new ConcurrentHashMap<>();

    public synchronized boolean add(String username, String destination) {
        return userSubscriptions
                .computeIfAbsent(username, k -> ConcurrentHashMap.newKeySet())
                .add(destination);
    }

    public void remove(String username) {
        userSubscriptions.remove(username);
    }

    public boolean isSubscribed(String username, String destination) {
        Set<String> destinations = userSubscriptions.get(username);
        return destinations != null && destinations.contains(destination);
    }
}
