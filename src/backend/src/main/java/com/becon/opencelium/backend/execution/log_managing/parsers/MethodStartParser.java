package com.becon.opencelium.backend.execution.log_managing.parsers;

import com.becon.opencelium.backend.execution.log_managing.commons.LogProcessingException;
import com.becon.opencelium.backend.execution.log_managing.commons.LogConstants;
import com.becon.opencelium.backend.execution.log_managing.commons.PropDescriptor;
import com.becon.opencelium.backend.execution.log_managing.core.LogLineParser;
import com.becon.opencelium.backend.execution.log_managing.core.ParsedLogLine;
import com.becon.opencelium.backend.execution.log_managing.commons.LogEntryType;

import java.util.Map;
import java.util.Set;
import java.util.stream.Collectors;

import static com.becon.opencelium.backend.execution.log_managing.commons.LogParserUtils.*;
import static com.becon.opencelium.backend.execution.log_managing.commons.PropDescriptor.of;

public class MethodStartParser implements LogLineParser {

    private static final LogEntryType entryType = LogEntryType.METHOD_START;
    private final Set<PropDescriptor> requiredProperties;

    public MethodStartParser() {
        this.requiredProperties = requiredProperties();
    }

    @Override
    public boolean supports(String line) {
        return entryType.equals(extractEntryType(line));
    }

    @Override
    public ParsedLogLine parse(String line) {
        if (!supports(line)) {
            throw LogProcessingException.unsupportedLine(line, entryType);
        }
        Map<String, String> props = extractKeyValuePairs(line, requiredProperties);
        ParsedLogLine pll = new ParsedLogLine();
        pll.setEntryType(entryType);
        pll.setProperties(parseDeeply(props));
        pll.setIndexPath(props.get(LogConstants.INDEX_PATH));
        pll.setSize(line.getBytes().length);
        return pll;
    }

    private Set<PropDescriptor> requiredProperties() {
        return Set.of(
                of(LogConstants.INDEX_PATH),
                of(LogConstants.FUNCTION),
                of(LogConstants.LOOP_INDEX, false)
        );
    }

    private Map<String, Object> parseDeeply(Map<String, String> props) {
        return props.entrySet().stream()
                .map(entry -> {
                    String key = entry.getKey();
                    String value = entry.getValue();

                    Object parsedValue;
                    if (LogConstants.LOOP_INDEX.equals(key)) {
                        try {
                            parsedValue = Integer.parseInt(value);
                        } catch (NumberFormatException e) {
                            throw LogProcessingException.invalidLoopIndex(value);
                        }
                    } else {
                        parsedValue = value;
                    }

                    return Map.entry(key, parsedValue);
                })
                .collect(Collectors.toMap(Map.Entry::getKey, Map.Entry::getValue));
    }
}
