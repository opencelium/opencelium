package com.becon.opencelium.backend.execution.logger.schema;

import com.becon.opencelium.backend.execution.logger.enums.LogDetailLevel;

import java.util.Map;

public class LogSchema {
    private Map<LogDetailLevel, PhaseSchema> schema; // contains description of lightweight or detailed Log Schema
    public PhaseSchema get(LogDetailLevel mode) {
        return schema.get(mode);
    }
}
