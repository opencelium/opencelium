package com.becon.opencelium.backend.execution.logger.parser.entity;

import com.becon.opencelium.backend.execution.logger.enums.LogLineStage;
import com.becon.opencelium.backend.execution.logger.enums.LogLineType;
import com.becon.opencelium.backend.execution.logger.enums.PhaseType;
import com.becon.opencelium.backend.execution.logger.enums.SegmentType;
import com.becon.opencelium.backend.execution.logger.keys.LogLineKey;

import java.util.HashMap;
import java.util.Map;

/**
 * Represents a single parsed log line, which can be either a phase-based entry
 * (e.g., FLOWCHART_START, OPERATION_END) or a segment-based entry
 * (e.g., REQUEST, RESPONSE_HEADER).
 */
public class ParsedLogLine {

    private LogLineType type;        // PHASE or SEGMENT
    private LogLineStage stage;             // e.g., "FLOWCHART_START", "REQUEST"
    private String rawLogLine;
    private long startOffset; // when started single log line
    private long endOffset; // when ended single log line
    private Map<LogLineKey, String> properties; // Other key-value fields (e.g., url, data, status)

    public ParsedLogLine() {
    }

    public ParsedLogLine(LogLineType type) {
        this.type = type;
    }

    public LogLineType getType() {
        return type;
    }

    public void setType(LogLineType type) {
        this.type = type;
    }

    public LogLineStage getStage() {
        return stage;
    }

    public void setStage(LogLineStage typeValue) {
        this.stage = typeValue;
    }

    public String getRawLogLine() {
        return rawLogLine;
    }

    public void setRawLogLine(String rawLogLine) {
        this.rawLogLine = rawLogLine;
    }

    public long getStartOffset() {
        return startOffset;
    }

    public void setStartOffset(long startOffset) {
        this.startOffset = startOffset;
    }

    public long getEndOffset() {
        return endOffset;
    }

    public void setEndOffset(long endOffset) {
        this.endOffset = endOffset;
    }

    public Map<LogLineKey, String> getProperties() {
        return properties;
    }

    public void setProperties(Map<LogLineKey, String> properties) {
        this.properties = properties;
    }

    @Override
    public String toString() {
        return "ParsedLogLine{" +
                "logLineType=" + type +
                ", stage=" + stage +
                ", startOffset=" + startOffset +
                ", endOffset=" + endOffset +
                ", properties=" + properties +
                '}';
    }

    public ParsedLogLine clone() {
        ParsedLogLine cloned = new ParsedLogLine(this.type);
        cloned.setStartOffset(this.startOffset);
        cloned.setEndOffset(this.endOffset);
        cloned.setStage(this.stage); // assuming LogLineStage is an enum or immutable
        cloned.setType(this.type);

        Map<LogLineKey, String> copiedProps = new HashMap<>(this.properties);
        cloned.setProperties(copiedProps);

        return cloned;
    }
}
