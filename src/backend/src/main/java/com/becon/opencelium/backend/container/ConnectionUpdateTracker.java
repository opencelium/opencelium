package com.becon.opencelium.backend.container;

import com.becon.opencelium.backend.database.mongodb.entity.ConnectionMng;
import com.becon.opencelium.backend.database.mongodb.entity.ConnectorMng;
import com.becon.opencelium.backend.database.mysql.entity.Connection;
import com.becon.opencelium.backend.database.mysql.service.ConnectionHistoryService;
import com.becon.opencelium.backend.enums.Action;
import com.becon.opencelium.backend.utility.patch.PatchHelper;
import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.github.fge.jsonpatch.JsonPatch;
import com.github.fge.jsonpatch.diff.JsonDiff;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Qualifier;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Component;

import java.util.ArrayList;
import java.util.Iterator;
import java.util.List;
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
            ObjectMapper objectMapper,
            @Qualifier("connectionHistoryServiceImp") ConnectionHistoryService CHS,
            PatchHelper patchHelper) {
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

    public void pushAndMakeHistory(Connection updated, Connection before, ConnectionMng updatedMng, ConnectionMng beforeMng, JsonPatch patch) {
        updated.setEnhancements(null);
        before.setEnhancements(null);
        updated.setSchedulers(null);
        before.setSchedulers(null);
        updated.setModifiedOn(null);
        before.setModifiedOn(null);

        JsonPatch forUndo = JsonDiff.asJsonPatch(objectMapper.valueToTree(updated), objectMapper.valueToTree(before));
        JsonPatch forUndoMng = JsonDiff.asJsonPatch(objectMapper.valueToTree(updatedMng), objectMapper.valueToTree(beforeMng));
        JsonPatch merged = merge(forUndo, forUndoMng);

        if (patchHelper.isEmpty(merged)) {
            return;
        }

        push(new Command(updated.getId(), merged));

        CHS.makeHistoryAndSave(updated, patch, Action.MODIFY);
    }

    public void pushAndMakeHistory(ConnectionMng connection, ConnectorMng before, ConnectorMng after, JsonPatch patch) {

        JsonPatch forUndo = JsonDiff.asJsonPatch(objectMapper.valueToTree(after), objectMapper.valueToTree(before));
        if (patchHelper.isEmpty(forUndo)) {
            return;
        }

        if (before.getConnectorId().equals(connection.getFromConnector().getConnectorId())) {
            forUndo = patchHelper.changeEachPath(forUndo, s -> "/fromConnector" + s);
        } else {
            forUndo = patchHelper.changeEachPath(forUndo, s -> "/toConnector" + s);
        }

        push(new Command(connection.getConnectionId(), forUndo));
        CHS.makeHistoryAndSave(connection.getConnectionId(), patch, Action.MODIFY);
    }

    private JsonPatch merge(JsonPatch patch, JsonPatch patchMng) {
        JsonNode jsonNode = objectMapper.convertValue(patch, JsonNode.class);
        Iterator<JsonNode> nodes = jsonNode.elements();
        List<JsonNode> merged = new ArrayList<>();
        while (nodes.hasNext()) {
            JsonNode next = nodes.next();
            String path = next.get("path").textValue();
            if (!path.startsWith("/enhancements"))
                merged.add(next);
        }

        jsonNode = objectMapper.convertValue(patchMng, JsonNode.class);
        nodes = jsonNode.elements();
        while (nodes.hasNext()) {
            JsonNode next = nodes.next();
            String path = next.get("path").textValue();
            if (path.startsWith("/fieldBindings"))
                merged.add(next);
        }
        return objectMapper.convertValue(merged, JsonPatch.class);
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
