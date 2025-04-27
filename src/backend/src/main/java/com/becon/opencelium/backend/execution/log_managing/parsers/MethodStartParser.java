package com.becon.opencelium.backend.execution.log_managing.parsers;

import com.becon.opencelium.backend.execution.log_managing.commons.*;
import com.becon.opencelium.backend.execution.log_managing.core.LogLineParser;
import com.becon.opencelium.backend.execution.log_managing.core.ParsedLogLine;

<<<<<<< HEAD
import java.nio.charset.StandardCharsets;
=======
import java.util.Map;
import java.util.Objects;
>>>>>>> cf58b7068 ([Modified] OC-1086 #comment Specified common data property with separate names due to its belonging component #time 15m)
import java.util.Set;

import static com.becon.opencelium.backend.execution.log_managing.commons.LogParserUtils.*;
import static com.becon.opencelium.backend.execution.log_managing.commons.PropDescriptor.of;

public class MethodStartParser implements LogLineParser {

    private static final LogEntryType entryType = LogEntryType.METHOD_START;
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
        pll.setIndexPath((String) pll.getProperties().get(LogPropertyKeys.INDEX_PATH));
        pll.setSize(line.getBytes(StandardCharsets.UTF_8).length);
        return pll;
    }

    /**
     * Defines the set of properties that must be present in the log line.
     *
     * @return a Set containing required property descriptors
     */
    private static Set<PropDescriptor> requiredProperties() {
        return Set.of(
                of(LogPropertyKeys.INDEX_PATH),
                of(LogPropertyKeys.FUNCTION),
                of(LogPropertyKeys.LOOP_INDEX, false, x -> PropertyParsers.parseInteger(LogPropertyKeys.LOOP_INDEX, x))
        );
    }
<<<<<<< HEAD
=======

    private Map<String, Object> parseDeeply(Map<String, String> props) {
        return props.entrySet().stream()
                .map(entry -> {
                    if (Objects.equals(entry.getKey(), LogConstants.INDEX_PATH)) {
                        return null;
                    }
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
                .filter(Objects::nonNull)
                .collect(Collectors.toMap(Map.Entry::getKey, Map.Entry::getValue));
    }
>>>>>>> cf58b7068 ([Modified] OC-1086 #comment Specified common data property with separate names due to its belonging component #time 15m)
}
