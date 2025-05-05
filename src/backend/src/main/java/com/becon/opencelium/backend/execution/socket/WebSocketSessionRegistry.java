package com.becon.opencelium.backend.execution.socket;

import org.springframework.stereotype.Component;

import java.util.Map;
import java.util.concurrent.ConcurrentHashMap;

@Component
public class WebSocketSessionRegistry {

    private final Map<Integer, String> sessions = new ConcurrentHashMap<>();
    private final Map<Integer, String> usernames = new ConcurrentHashMap<>();

    public synchronized boolean register(int userId, String sessionId) {
        String existingId = sessions.get(userId);

        if (existingId != null && !existingId.equals(sessionId)) {
            // Do not allow more than one session
            return false;
        }

        sessions.put(userId, sessionId);
        return true;
    }

    public boolean unregister(int userId, String sessionId) {
        String existingId = sessions.get(userId);

        if (existingId != null && !existingId.equals(sessionId)) {
            return false;
        }

        sessions.remove(userId);
        usernames.remove(userId);
        return true;
    }

    public void addUsername(int userId, String username) {
        usernames.put(userId, username);
    }

    public String getUsername(int userId) {
        return usernames.get(userId);
    }

    public int getUserId(String username) {
        for (Map.Entry<Integer, String> entry : usernames.entrySet()) {
            if (entry.getValue().equals(username)) {
                return entry.getKey();
            }
        }

        return -1;
    }
}
