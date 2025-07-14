package com.becon.opencelium.backend.execution.logger.context;

import com.becon.opencelium.backend.execution.logger.enums.SegmentType;
import com.becon.opencelium.backend.execution.logger.keys.LogLineKey;
import com.becon.opencelium.backend.execution.logger.parser.entity.ParsedLogLine;

import java.util.HashMap;
import java.util.Map;

public class SegmentContext {

    private final SegmentType segmentType;
    private final Map<LogLineKey, String> properties = new HashMap<>();

    public SegmentContext(SegmentType segmentType) {
        this.segmentType = segmentType;
    }

    public SegmentType getSegmentType() {
        return segmentType;
    }

    public Map<LogLineKey, String> getAllProperties() {
        return properties;
    }

    public void addProperty(LogLineKey key, String value) {
        this.properties.put(key, value);
    }

    public String getProperty(LogLineKey key) {
        return this.properties.get(key);
    }
}
