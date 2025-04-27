package com.becon.opencelium.backend.execution.log_managing.parsers;

import com.becon.opencelium.backend.execution.log_managing.commons.*;
import com.becon.opencelium.backend.execution.log_managing.core.LogLineParser;
import com.becon.opencelium.backend.execution.log_managing.core.ParsedLogLine;

import java.nio.charset.StandardCharsets;
import java.util.Set;

import static com.becon.opencelium.backend.execution.log_managing.commons.LogParserUtils.extractEntryType;
import static com.becon.opencelium.backend.execution.log_managing.commons.PropDescriptor.of;

public class ResponsePayloadParser implements LogLineParser {

    private static final LogEntryType entryType = LogEntryType.RESPONSE_PAYLOAD;
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
        ParsedLogLine pll = new ParsedLogLine();
        pll.setEntryType(entryType);
        pll.setProperties(LogParserUtils.extractOutermostProperties(line, requiredProperties));
        pll.setIndexPath(null);
        pll.setSize(line.getBytes(StandardCharsets.UTF_8).length);
        return pll;
    }

<<<<<<< HEAD
    /**
     * Defines the set of properties that must be present in the log line.
     *
     * @return a Set containing required property descriptors
     */
    private static Set<PropDescriptor> requiredProperties() {
        return Set.of(of(LogPropertyKeys.DATA, PropertyParsers::parseData));
=======
    private Set<PropDescriptor> requiredProperties() {
        return Set.of(of(LogConstants.RESPONSE_BODY));
    }

    private Map<String, Object> parseDeeply(Map<String, String> props) {
        return props.entrySet().stream()
                .map(entry -> {
                    String key = entry.getKey();
                    String value = entry.getValue();

                    Object parsedValue;
                    if (LogConstants.RESPONSE_BODY.equals(key)) {
                        parsedValue = LogParserUtils.parseMap(entry.getValue());
                    } else {
                        parsedValue = value;
                    }

                    return Map.entry(key, parsedValue);
                })
                .collect(Collectors.toMap(Map.Entry::getKey, Map.Entry::getValue));
>>>>>>> cf58b7068 ([Modified] OC-1086 #comment Specified common data property with separate names due to its belonging component #time 15m)
    }

}
