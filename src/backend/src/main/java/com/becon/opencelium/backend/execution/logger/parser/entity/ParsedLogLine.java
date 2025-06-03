package com.becon.opencelium.backend.execution.logger.parser.entity;

import com.becon.opencelium.backend.execution.logger.enums.LogLineType;
import com.becon.opencelium.backend.execution.logger.enums.LogLineStage;

import java.util.Map;

/**
 * Represents a single parsed log line, which can be either a phase-based entry
 * (e.g., FLOWCHART_START, OPERATION_END) or a segment-based entry
 * (e.g., REQUEST, RESPONSE_HEADER).
 */
public class ParsedLogLine {

    private LogLineType logLineType;        // PHASE or SEGMENT
    private LogLineStage stage;             // e.g., "FLOWCHART_START", "REQUEST"
    private long offset;
    private Map<String, String> properties; // Other key-value fields (e.g., url, data, status)

    public LogLineType getLogLineType() {
        return logLineType;
    }

    public void setLogLineType(LogLineType logLineType) {
        this.logLineType = logLineType;
    }

    public LogLineStage getStage() {
        return stage;
    }

    public void setStage(LogLineStage stage) {
        this.stage = stage;
    }

    public long getOffset() {
        return offset;
    }

    public void setOffset(long offset) {
        this.offset = offset;
    }

    public Map<String, String> getProperties() {
        return properties;
    }

    public void setProperties(Map<String, String> properties) {
        this.properties = properties;
    }

    @Override
    public String toString() {
        return "ParsedLogLine{" +
                "logLineType=" + logLineType +
                ", value=" + stage +
                ", offset=" + offset +
                ", properties=" + properties +
                '}';
    }
}
