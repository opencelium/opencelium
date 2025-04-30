package com.becon.opencelium.backend.execution.log_managing.parsers;

import com.becon.opencelium.backend.execution.log_managing.commons.LogPropertyKeys;
import com.becon.opencelium.backend.execution.log_managing.commons.LogParserUtils;
import com.becon.opencelium.backend.execution.log_managing.commons.LogProcessingException;
import com.becon.opencelium.backend.execution.log_managing.commons.PropDescriptor;
import com.becon.opencelium.backend.execution.log_managing.core.LogLineParser;
import com.becon.opencelium.backend.execution.log_managing.core.ParsedLogLine;
import com.becon.opencelium.backend.execution.log_managing.commons.LogEntryType;

import java.nio.charset.StandardCharsets;
import java.util.Map;
import java.util.Set;
import java.util.stream.Collectors;

import static com.becon.opencelium.backend.execution.log_managing.commons.LogParserUtils.extractEntryType;
import static com.becon.opencelium.backend.execution.log_managing.commons.LogParserUtils.extractKeyValuePairs;
import static com.becon.opencelium.backend.execution.log_managing.commons.PropDescriptor.of;

public class RequestPayloadParser implements LogLineParser {

    private static final LogEntryType entryType = LogEntryType.REQUEST_PAYLOAD;
    private static final Set<PropDescriptor> requiredProperties;

    static {
        requiredProperties = requiredProperties();
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
        pll.setSize(line.getBytes(StandardCharsets.UTF_8).length);
        return pll;
    }

    /**
     * Filters only concrete properties and converts them to their precise type that it is supposed to be
     *
     * @return a Map of key, and precise value
     */
    private Map<String, Object> parseDeeply(Map<String, String> props) {
        return props.entrySet().stream()
                .map(entry -> {
                    String key = entry.getKey();
                    String value = entry.getValue();

                    Object parsedValue;
                    if (LogPropertyKeys.DATA.equals(key)) {
                        parsedValue = LogParserUtils.parseMap(entry.getValue());
                    } else {
                        parsedValue = value;
                    }

                    return Map.entry(key, parsedValue);
                })
                .collect(Collectors.toMap(Map.Entry::getKey, Map.Entry::getValue));
    }

    /**
     * Defines the set of properties that must be present in the log line.
     *
     * @return a Set containing required property descriptors
     */
    private static Set<PropDescriptor> requiredProperties() {
        return Set.of(of(LogPropertyKeys.DATA));
    }

}
