package com.becon.opencelium.backend.execution.logger.parser;

import com.becon.opencelium.backend.execution.logger.keys.LogLineKey;
import com.becon.opencelium.backend.execution.logger.mapper.ParsedLogLineMapper;
import com.becon.opencelium.backend.execution.logger.parser.entity.ParsedLogLine;
import org.springframework.stereotype.Component;

import java.util.Map;

@Component
public class ParsedLogLineBuilder {
    private final LogLineParser parser;
    private final ParsedLogLineMapper mapper;

    public ParsedLogLineBuilder(LogLineParser parser, ParsedLogLineMapper mapper) {
        this.parser = parser;
        this.mapper = mapper;
    }

    // Determines if the line can be parsed.
    public boolean supports(String line) {
        return parser.supports(line);
    }

    // Fully builds a ParsedLogLine from a raw log line with offset
    public ParsedLogLine build(String line, long startOffset, long endOffset) {
        Map<LogLineKey, String> parsed = parser.parse(line);
        return mapper.map(parsed, startOffset, endOffset);
    }

    // Fully builds a ParsedLogLine from a raw log line skipping offset
    // Required when we need parse part of log and send to client
    public ParsedLogLine build(String line) {
        Map<LogLineKey, String> parsed = parser.parse(line);
        return mapper.map(parsed);
    }
}
