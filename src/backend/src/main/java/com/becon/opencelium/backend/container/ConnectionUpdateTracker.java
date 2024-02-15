package com.becon.opencelium.backend.container;

import com.becon.opencelium.backend.database.mysql.service.ConnectionHistoryService;
import com.becon.opencelium.backend.enums.Action;
import com.becon.opencelium.backend.resource.connection.ConnectionDTO;
import com.becon.opencelium.backend.utility.patch.PatchHelper;
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
    private static final Integer QUEUE_CAPACITY = 40;
    private static final long SAVING_DURATION = 15 * 60 * 1000;
    private final Map<Long, LinkedBlockingDeque<Command>> queues;
    private static final Logger logger = LoggerFactory.getLogger(ConnectionUpdateTracker.class);
    private final ObjectMapper objectMapper;
    private final ConnectionHistoryService CHS;
    private final PatchHelper patchHelper;

    public ConnectionUpdateTracker(
            @Qualifier("connectionHistoryServiceImp") ConnectionHistoryService CHS,
            ObjectMapper objectMapper,
            PatchHelper patchHelper
    ) {
        this.CHS = CHS;
        this.queues = new ConcurrentHashMap<>();
        this.objectMapper = objectMapper;
        this.patchHelper = patchHelper;
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

    public void pushAndMakeHistory(ConnectionDTO before, ConnectionDTO after, JsonPatch patch) {
        if (after.getFieldBindings() == null && before.getFieldBindings().isEmpty()) {
            before.setFieldBindings(null);
        }
        if (after.getFromConnector() != null
                && after.getFromConnector().getMethods() == null
                && before.getFromConnector() != null
                && before.getFromConnector().getMethods().isEmpty()) {
            before.getFromConnector().setMethods(null);
        }
        if (after.getToConnector() != null
                && after.getToConnector().getMethods() == null
                && before.getToConnector() != null
                && before.getToConnector().getMethods().isEmpty()) {
            before.getToConnector().setMethods(null);
        }
        if (after.getFromConnector() != null
                && after.getFromConnector().getOperators() == null
                && before.getFromConnector() != null
                && before.getFromConnector().getOperators().isEmpty()) {
            before.getFromConnector().setOperators(null);
        }
        if (after.getToConnector() != null
                && after.getToConnector().getOperators() == null
                && before.getToConnector() != null
                && before.getToConnector().getOperators().isEmpty()) {
            before.getToConnector().setOperators(null);
        }

        JsonPatch forUndo = JsonDiff.asJsonPatch(objectMapper.valueToTree(after), objectMapper.valueToTree(before));
        if (patchHelper.isEmpty(forUndo)) {
            return;
        }
        push(new Command(before.getConnectionId(), forUndo));
        CHS.makeHistoryAndSave(before.getConnectionId(), patch, Action.MODIFY);
    }

    @Scheduled(initialDelay = 0, fixedDelay = 60_000)
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
                    if (queue.isEmpty()) {
                        queues.remove(entry.getKey());
                    }
                } else {
                    break;
                }
            }
        }
    }
}
