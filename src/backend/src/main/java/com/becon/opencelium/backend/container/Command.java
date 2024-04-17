package com.becon.opencelium.backend.container;

import com.github.fge.jsonpatch.JsonPatch;

public class Command {
    private final Long connectionId;
    private final long timestamp;
    private final JsonPatch jsonPatch;

    public Command(Long connectionId, JsonPatch jsonPatch) {
        this.connectionId = connectionId;
        this.timestamp = System.currentTimeMillis();
        this.jsonPatch = jsonPatch;
    }

    public JsonPatch getJsonPatch() {
        return jsonPatch;
    }
    public long getTimestamp() {
        return timestamp;
    }
    public Long getConnectionId() {
        return connectionId;
    }
}

