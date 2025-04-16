package com.becon.opencelium.backend.execution.log_managing.core;

public interface LogLineParser {
    boolean supports(String line);
    ParsedLogLine parse(String line);
}
