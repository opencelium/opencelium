package com.becon.opencelium.backend.execution.logger.parser;

import com.becon.opencelium.backend.execution.logger.enums.LogLineType;
import com.becon.opencelium.backend.execution.logger.enums.LogLineValue;
import com.becon.opencelium.backend.execution.logger.parser.entity.ParsedLogLine;
import org.springframework.stereotype.Component;

import java.util.LinkedHashMap;
import java.util.Map;
import java.util.Set;

@Component
public class ParsedLogLineMapper {
    // Fields commonly known and excluded from "properties"
    private static final Set<String> EXCLUDED_KEYS = Set.of(
            "timestamp", "log_level", "msg", "segment", "phase", "indexPath"
    );

    /**
     * Converts a parsed map into a ParsedLogLine.
     *
     * @param parsedMap the key-value map returned from FlexiblePatternLogParser
     * @param offset    the character offset in the log file
     * @return a ParsedLogLine with type, value, indexPath, offset, and remaining properties
     * @throws IllegalArgumentException if neither `segment` nor `phase` is found or LogLineValue is unknown
     */
    public ParsedLogLine map(Map<String, String> parsedMap, long offset) {
        ParsedLogLine parsedLogLine = new ParsedLogLine();
        Map<String, String> properties = new LinkedHashMap<>();

        // Determine log line type and value
        String typeKey = null;
        LogLineType type = null;

        if (parsedMap.containsKey("segment")) {
            typeKey = "segment";
            type = LogLineType.SEGMENT;
        } else if (parsedMap.containsKey("phase")) {
            typeKey = "phase";
            type = LogLineType.PHASE;
        } else {
            throw new IllegalArgumentException("Log line must contain either 'segment' or 'phase'. Parsed keys: " + parsedMap.keySet());
        }

        String rawValue = parsedMap.get(typeKey);
        LogLineValue lineValue;
        try {
            lineValue = LogLineValue.fromString(rawValue);
        } catch (IllegalArgumentException e) {
            throw new IllegalArgumentException("Unrecognized value for " + typeKey + ": " + rawValue, e);
        }

        parsedLogLine.setLogLineType(type);
        parsedLogLine.setValue(lineValue);

        // Set indexPath if present
        if (parsedMap.containsKey("indexPath")) {
            parsedLogLine.setIndexPath(parsedMap.get("indexPath"));
        }

        // Set offset
        parsedLogLine.setOffset(offset);

        // Include all other unknown fields in the 'properties' map
        for (Map.Entry<String, String> entry : parsedMap.entrySet()) {
            if (!EXCLUDED_KEYS.contains(entry.getKey())) {
                properties.put(entry.getKey(), entry.getValue());
            }
        }

        parsedLogLine.setProperties(properties);
        return parsedLogLine;
    }
}
