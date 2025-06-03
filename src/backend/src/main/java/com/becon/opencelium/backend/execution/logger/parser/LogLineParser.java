package com.becon.opencelium.backend.execution.logger.parser;

import java.util.List;
import java.util.Map;

public interface LogLineParser {
    boolean supports(String line);
    Map<String, String> parse(String line);
    List<String> readLines(String executionId, long startOffset, long endOffset);
}
