package com.becon.opencelium.backend.container;

import com.becon.opencelium.backend.database.mysql.entity.Connection;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.github.fge.jsonpatch.JsonPatch;
import com.github.fge.jsonpatch.diff.JsonDiff;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Component;

import java.util.Iterator;
import java.util.Map;
import java.util.concurrent.ConcurrentHashMap;
import java.util.concurrent.LinkedBlockingDeque;

@Component
public class ConnectionHistoryManager {
    private final Integer QUEUE_CAPACITY = 40;
    private final long SAVING_DURATION = 15 * 60 * 1000;
    private final Map<Long, LinkedBlockingDeque<Command>> queues;
    private static final Logger logger = LoggerFactory.getLogger(ConnectionHistoryManager.class);
    private final ObjectMapper objectMapper;


    public ConnectionHistoryManager(ObjectMapper objectMapper) {
        this.queues = new ConcurrentHashMap<>();
        this.objectMapper = objectMapper;
    }

    public Command undo(Long connectionId) {
        if (queues.containsKey(connectionId)) {
            LinkedBlockingDeque<Command> commands = queues.get(connectionId);
            if (!commands.isEmpty()) {
                return commands.removeLast();
            }
        }
        return null;
    }

    public void push(Command command) {
        if (queues.containsKey(command.getConnectionId())) {
            try {
                queues.get(command.getConnectionId()).add(command);
            } catch (IllegalStateException e) {
                queues.get(command.getConnectionId()).remove();
                queues.get(command.getConnectionId()).add(command);
            }
        } else {
            LinkedBlockingDeque<Command> newDeque = new LinkedBlockingDeque<>(QUEUE_CAPACITY);
            newDeque.add(command);
            queues.put(command.getConnectionId(), newDeque);
        }
    }

    public void push(Connection after, Connection before){
        after.setEnhancements(null);
        before.setEnhancements(null);
        after.setSchedulers(null);
        before.setSchedulers(null);

        JsonPatch diff = JsonDiff.asJsonPatch(objectMapper.valueToTree(before), objectMapper.valueToTree(after));

        push(new Command(after.getId(), diff));
    }

    @Scheduled(initialDelay = 60_000, fixedDelay = 60_000)
    private void clear() {
        for (Map.Entry<Long, LinkedBlockingDeque<Command>> entry : queues.entrySet()) {
            long currentTimeMillis = System.currentTimeMillis();
            LinkedBlockingDeque<Command> queue = entry.getValue();
            Iterator<Command> iterator = queue.iterator();
            while (iterator.hasNext()) {
                Command command = iterator.next();
                if (command.getTimestamp() + SAVING_DURATION < currentTimeMillis) {
                    iterator.remove();
                    logger.info("Connection(id = {}) history removed because time limit exceeded. This connection has {} chance(s) to undo", command.getConnectionId(), queue.size());
                    if (queue.size() == 0) {
                        queues.remove(entry.getKey());
                    }
                } else {
                    break;
                }
            }
        }
    }


}
