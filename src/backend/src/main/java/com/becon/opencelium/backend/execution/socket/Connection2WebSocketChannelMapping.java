package com.becon.opencelium.backend.execution.socket;

import org.springframework.stereotype.Component;

import java.util.Map;
import java.util.concurrent.ConcurrentHashMap;

@Component
public class Connection2WebSocketChannelMapping {

    private final Map<Long, String> mapping = new ConcurrentHashMap<>();

    public synchronized void add(Long connectionId, String channelId) {
        mapping.put(connectionId, channelId);
    }

    public void remove(Long connectionId) {
        mapping.remove(connectionId);
    }

    public String getChannelId(Long connectionId) {
        if (mapping.containsKey(connectionId)) {
            return mapping.get(connectionId);
        } else {
            throw new RuntimeException("No mapping found for connectionId = " + connectionId);
        }
    }
}
