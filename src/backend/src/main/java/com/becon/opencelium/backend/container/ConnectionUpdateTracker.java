package com.becon.opencelium.backend.container;

import com.becon.opencelium.backend.database.mysql.entity.Connection;
import com.becon.opencelium.backend.database.mysql.service.ConnectionHistoryService;
import com.becon.opencelium.backend.enums.Action;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.github.fge.jsonpatch.JsonPatch;
import com.github.fge.jsonpatch.diff.JsonDiff;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Qualifier;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Component;

import java.util.Iterator;
import java.util.Map;
import java.util.concurrent.ConcurrentHashMap;
import java.util.concurrent.LinkedBlockingDeque;

@Component
public class ConnectionUpdateTracker {
    private final Integer QUEUE_CAPACITY = 40;
    private final long SAVING_DURATION = 15 * 60 * 1000;
    private final Map<Long, LinkedBlockingDeque<Command>> queues;
    private static final Logger logger = LoggerFactory.getLogger(ConnectionUpdateTracker.class);
    private final ObjectMapper objectMapper;
    private final ConnectionHistoryService CHS;

    public ConnectionUpdateTracker(
            ObjectMapper objectMapper,
            @Qualifier("connectionHistoryServiceImp") ConnectionHistoryService CHS
    ) {
        this.CHS = CHS;
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

    public void pushAndMakeHistory(Connection target, Connection source){
        target.setEnhancements(null);
        source.setEnhancements(null);
        target.setSchedulers(null);
        source.setSchedulers(null);
        target.setModifiedOn(null);
        source.setModifiedOn(null);

        JsonPatch forHistory = JsonDiff.asJsonPatch(objectMapper.valueToTree(source), objectMapper.valueToTree(target));
        JsonPatch forUndo = JsonDiff.asJsonPatch(objectMapper.valueToTree(target), objectMapper.valueToTree(source));

        push(new Command(target.getId(), forUndo));

        Connection connection = new Connection();
        connection.setId(target.getId());
        CHS.makeHistoryAndSave(connection, forHistory, Action.MODIFY);
    }

    @Scheduled(initialDelay = 840_000, fixedDelay = 60_000)
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
