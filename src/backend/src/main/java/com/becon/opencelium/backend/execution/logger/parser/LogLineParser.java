package com.becon.opencelium.backend.execution.logger.parser;

import com.becon.opencelium.backend.execution.logger.parser.entity.ParsedLogLine;

import java.util.Map;

public interface LogLineParser {
    boolean supports(String line);
    Map<String, String> parse(String line);
}
