package com.becon.opencelium.backend.execution.log_managing.parsers;

import com.becon.opencelium.backend.execution.log_managing.commons.*;
import com.becon.opencelium.backend.execution.log_managing.core.LogLineParser;
import com.becon.opencelium.backend.execution.log_managing.core.ParsedLogLine;

import java.nio.charset.StandardCharsets;
import java.util.Set;

import static com.becon.opencelium.backend.execution.log_managing.commons.LogParserUtils.*;
import static com.becon.opencelium.backend.execution.log_managing.commons.PropDescriptor.of;

public class ResponseParser implements LogLineParser {

    private static final LogEntryType entryType = LogEntryType.RESPONSE;
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

    /**
     * Defines the set of properties that must be present in the log line.
     *
     * @return a Set containing required property descriptors
     */
    private static Set<PropDescriptor> requiredProperties() {
        return Set.of(
                of(LogPropertyKeys.STATUS, x -> PropertyParsers.parseInteger(LogPropertyKeys.STATUS, x)),
                of(LogPropertyKeys.RESPONSE_TIME, x -> PropertyParsers.parseInteger(LogPropertyKeys.RESPONSE_TIME, x))
        );
    }

}
