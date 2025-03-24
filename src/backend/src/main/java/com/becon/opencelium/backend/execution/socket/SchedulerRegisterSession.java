package com.becon.opencelium.backend.execution.socket;

import org.springframework.stereotype.Component;

import java.util.Set;
import java.util.concurrent.ConcurrentHashMap;

@Component
public class SchedulerRegisterSession {
    // Store only schedulerIds (Set ensures uniqueness)
    private final Set<Integer> activeSchedulers = ConcurrentHashMap.newKeySet();

    // Add scheduler ID when WebSocket connects
    public void addScheduler(Integer schedulerId) {
        activeSchedulers.add(schedulerId);
    }

    // Remove scheduler ID when WebSocket disconnects
    public void removeScheduler(Integer schedulerId) {
        activeSchedulers.remove(schedulerId);
    }

    // Check if a scheduler is active
    public boolean isSchedulerActive(Integer schedulerId) {
        return activeSchedulers.contains(schedulerId);
    }
}
