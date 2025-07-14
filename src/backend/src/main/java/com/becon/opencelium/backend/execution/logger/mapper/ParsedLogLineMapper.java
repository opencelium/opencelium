package com.becon.opencelium.backend.execution.logger.mapper;

import com.becon.opencelium.backend.execution.logger.context.PhaseContext;
import com.becon.opencelium.backend.execution.logger.context.SegmentContext;
import com.becon.opencelium.backend.execution.logger.enums.LogLineStage;
import com.becon.opencelium.backend.execution.logger.enums.LogLineType;
import com.becon.opencelium.backend.execution.logger.enums.PhaseType;
import com.becon.opencelium.backend.execution.logger.enums.SegmentType;
import com.becon.opencelium.backend.execution.logger.keys.LogLineKey;
import com.becon.opencelium.backend.execution.logger.parser.entity.ParsedLogLine;
import org.springframework.stereotype.Component;

import java.util.List;
import java.util.Map;

@Component
public class ParsedLogLineMapper {

    /**
     * Converts a parsed map into a ParsedLogLine.
     *
     * @param parsedMap the key-value map returned from FlexiblePatternLogParser
     * @param offset    the character offset in the log file
     * @return a ParsedLogLine with type, value, indexPath, offset, and remaining properties
     * @throws IllegalArgumentException if neither `segment` nor `phase` is found or LogLineValue is unknown
     */
    public ParsedLogLine map(Map<LogLineKey, String> parsedMap, long offset) {
        ParsedLogLine parsedLogLine = new ParsedLogLine();

        // Determine log line type and stage key
        LogLineType type;
        LogLineKey key;

        if (parsedMap.containsKey(LogLineKey.SEGMENT)) {
            type = LogLineType.SEGMENT;
            key = LogLineKey.SEGMENT;
        } else if (parsedMap.containsKey(LogLineKey.PHASE)) {
            type = LogLineType.PHASE;
            key = LogLineKey.PHASE;
        } else {
            throw new IllegalArgumentException("Missing required key: 'segment' or 'phase'. Keys: " + parsedMap.keySet());
        }
        String rawValue = parsedMap.get(key);
        LogLineStage stage = switch (type) {
            case SEGMENT -> SegmentType.fromString(rawValue);
            case PHASE -> PhaseType.valueOf(rawValue); // optional: wrap with error handling
        };

        parsedLogLine.setType(type);
        parsedLogLine.setStage(stage);

        // Set offset
        parsedLogLine.setOffset(offset);
        parsedLogLine.setProperties(parsedMap);
        return parsedLogLine;
    }

    public PhaseContext toPhaseContext(ParsedLogLine line, List<String> allowedKeys) {
        if (line.getType() != LogLineType.PHASE) {
            throw new IllegalArgumentException("Expected PHASE line, got: " + line.getType());
        }

        PhaseContext context = new PhaseContext(line);
        Map<LogLineKey, String> rawProps = line.getProperties();

        if (allowedKeys == null || allowedKeys.isEmpty()) {
            // Include all properties
            rawProps.forEach(context::addProperty);
        } else {
            for (String key : allowedKeys) {
                if (LogLineKey.from(key).isEmpty()) {
                    throw new IllegalArgumentException(String.format("Key '%s' from log-schema.json file not found in LogLineKeys", key));
                }
                LogLineKey logKey = LogLineKey.from(key).get();
                if (rawProps.containsKey(logKey)) {
                    context.addProperty(logKey, rawProps.get(logKey));
                }
            }
        }
        return context;
    }

    public SegmentContext toSegmentContext(ParsedLogLine line, List<String> allowedKeys) {
        if (line.getType() != LogLineType.SEGMENT) {
            throw new IllegalArgumentException("Expected SEGMENT line, got: " + line.getType());
        }

        SegmentContext context = new SegmentContext((SegmentType) line.getStage());
        Map<LogLineKey, String> rawProps = line.getProperties();

        if (allowedKeys == null || allowedKeys.isEmpty()) {
            // Include all properties
            rawProps.forEach(context::addProperty);
        } else {
            for (String key : allowedKeys) {
                if (LogLineKey.from(key).isEmpty()) {
                    throw new IllegalArgumentException(String.format("Key '%s' from log-schema.json file not found in LogLineKeys", key));
                }
                LogLineKey logKey = LogLineKey.from(key).get();
                if (rawProps.containsKey(logKey)) {
                    context.addProperty(logKey, rawProps.get(logKey));
                }
            }
        }
        return context;
    }
}
