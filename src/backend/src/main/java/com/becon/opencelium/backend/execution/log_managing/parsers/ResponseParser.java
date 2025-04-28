package com.becon.opencelium.backend.execution.log_managing.parsers;

import com.becon.opencelium.backend.execution.log_managing.commons.LogConstants;
import com.becon.opencelium.backend.execution.log_managing.commons.LogProcessingException;
import com.becon.opencelium.backend.execution.log_managing.commons.PropDescriptor;
import com.becon.opencelium.backend.execution.log_managing.core.LogLineParser;
import com.becon.opencelium.backend.execution.log_managing.core.ParsedLogLine;
import com.becon.opencelium.backend.execution.log_managing.commons.LogEntryType;

import java.util.Map;
import java.util.Set;
import java.util.stream.Collectors;

import static com.becon.opencelium.backend.execution.log_managing.commons.LogParserUtils.*;
import static com.becon.opencelium.backend.execution.log_managing.commons.PropDescriptor.of;

public class ResponseParser implements LogLineParser {

    private static final LogEntryType entryType = LogEntryType.RESPONSE;
    private final Set<PropDescriptor> requiredProperties;

    public ResponseParser() {
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
        pll.setIndexPath(null);
        pll.setSize(line.getBytes().length);
        return pll;
    }

    private Set<PropDescriptor> requiredProperties() {
        return Set.of(
                of(LogConstants.STATUS),
                of(LogConstants.RESPONSE_TIME)
        );
    }

    private Map<String, Object> parseDeeply(Map<String, String> props) {
        return props.entrySet().stream()
                .map(entry -> {
                    if (LogConstants.RESPONSE_TIME.equals(entry.getKey())) {
                        try {
                            return Map.entry(entry.getKey(), Integer.parseInt(entry.getValue()));
                        } catch (NumberFormatException e) {
                            throw LogProcessingException.invalidValueForProperty(entry.getKey(), entry.getValue());
                        }
                    } else if (LogConstants.STATUS.equals(entry.getKey())) {
                        try {
                            return Map.entry(entry.getKey(), Integer.parseInt(entry.getValue()));
                        } catch (NumberFormatException e) {
                            throw LogProcessingException.invalidValueForProperty(entry.getKey(), entry.getValue());
                        }
                    }
                    return entry;
                })
                .collect(Collectors.toMap(Map.Entry::getKey, Map.Entry::getValue));
    }

}
