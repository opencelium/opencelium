package com.becon.opencelium.backend.execution.log_managing.parsers;

import com.becon.opencelium.backend.execution.log_managing.commons.LogParserUtils;
import com.becon.opencelium.backend.execution.log_managing.commons.LogConstants;
import com.becon.opencelium.backend.execution.log_managing.commons.LogParsingException;
import com.becon.opencelium.backend.execution.log_managing.commons.PropDescriptor;
import com.becon.opencelium.backend.execution.log_managing.core.LogLineParser;
import com.becon.opencelium.backend.execution.log_managing.core.ParsedLogLine;
import com.becon.opencelium.backend.execution.log_managing.commons.LogEntryType;

import java.util.Map;
import java.util.Set;
import java.util.stream.Collectors;

import static com.becon.opencelium.backend.execution.log_managing.commons.LogParserUtils.extractEntryType;
import static com.becon.opencelium.backend.execution.log_managing.commons.LogParserUtils.extractKeyValuePairs;
import static com.becon.opencelium.backend.execution.log_managing.commons.PropDescriptor.of;

public class RequestHeaderParser implements LogLineParser {

    private static final LogEntryType entryType = LogEntryType.REQUEST_HEADER;
    private final Set<PropDescriptor> requiredProperties;

    public RequestHeaderParser() {
        this.requiredProperties = requiredProperties();
    }

    @Override
    public boolean supports(String line) {
        return entryType.equals(extractEntryType(line));
    }

    @Override
    public ParsedLogLine parse(String line) {
        if (!supports(line)) {
            throw LogParsingException.unsupportedLine(line, entryType);
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
        return Set.of(of(LogConstants.DATA));
    }

    private Map<String, Object> parseDeeply(Map<String, String> props) {
        return props.entrySet().stream()
                .map(entry -> {
                    String key = entry.getKey();
                    String value = entry.getValue();

                    Object parsedValue;
                    if (LogConstants.DATA.equals(key)) {
                        parsedValue = LogParserUtils.parseMap(entry.getValue());
                    } else {
                        parsedValue = value;
                    }

                    return Map.entry(key, parsedValue);
                })
                .collect(Collectors.toMap(Map.Entry::getKey, Map.Entry::getValue));
    }

}
