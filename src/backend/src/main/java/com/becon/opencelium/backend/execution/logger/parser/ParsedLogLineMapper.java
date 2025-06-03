package com.becon.opencelium.backend.execution.logger.parser;

import com.becon.opencelium.backend.execution.logger.enums.LogLineType;
import com.becon.opencelium.backend.execution.logger.enums.LogLineStage;
import com.becon.opencelium.backend.execution.logger.parser.entity.ParsedLogLine;
import org.springframework.stereotype.Component;

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
    public ParsedLogLine map(Map<String, String> parsedMap, long offset) {
        ParsedLogLine parsedLogLine = new ParsedLogLine();

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
        LogLineStage lineValue;
        try {
            lineValue = LogLineStage.fromString(rawValue);
        } catch (IllegalArgumentException e) {
            throw new IllegalArgumentException("Unrecognized value for " + typeKey + ": " + rawValue, e);
        }

        parsedLogLine.setLogLineType(type);
        parsedLogLine.setStage(lineValue);

        // Set offset
        parsedLogLine.setOffset(offset);
        parsedLogLine.setProperties(parsedMap);
        return parsedLogLine;
    }
}
