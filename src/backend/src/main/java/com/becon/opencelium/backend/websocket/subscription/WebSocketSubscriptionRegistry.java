package com.becon.opencelium.backend.websocket.subscription;

import com.becon.opencelium.backend.websocket.RunningJobsBroadcaster;
import com.becon.opencelium.backend.websocket.constant.SocketConstant;
import org.springframework.stereotype.Component;

import java.util.Map;
import java.util.Set;
import java.util.concurrent.ConcurrentHashMap;

@Component
public class WebSocketSubscriptionRegistry {
    private final Map<Integer, Set<String>> userSubscriptions;
    private final RunningJobsBroadcaster runningJobsBroadcaster;

    public WebSocketSubscriptionRegistry(RunningJobsBroadcaster runningJobsBroadcaster) {
        this.userSubscriptions = new ConcurrentHashMap<>();
        this.runningJobsBroadcaster = runningJobsBroadcaster;
    }

    public synchronized boolean add(int userId, String destination) {
        if (SocketConstant.SCHEDULER_DESTINATION.equals(destination)) {
            runningJobsBroadcaster.broadcast();
        }

        return userSubscriptions
                .computeIfAbsent(userId, k -> ConcurrentHashMap.newKeySet())
                .add(destination);
    }

    public void remove(int userId, String destination) {
        if (destination != null) {
            userSubscriptions.get(userId).remove(destination);
        }
    }

    public boolean hasSubscription(String destination) {
        return userSubscriptions.values().stream()
                .anyMatch(set -> set.contains(destination));
    }
}
