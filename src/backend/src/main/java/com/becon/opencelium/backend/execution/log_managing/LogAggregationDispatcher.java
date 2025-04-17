package com.becon.opencelium.backend.execution.log_managing;

import com.becon.opencelium.backend.database.mongodb.service.LogMetaDataService;
import com.becon.opencelium.backend.execution.log_managing.core.ExecutionContextManager;
import com.becon.opencelium.backend.execution.log_managing.core.LogAggregationEngine;
import com.becon.opencelium.backend.execution.log_managing.core.LogLineParser;
import com.becon.opencelium.backend.execution.log_managing.core.ParsedLogLine;
import org.springframework.stereotype.Component;

import java.util.HashSet;
import java.util.Optional;
import java.util.Set;

@Component
public class LogAggregationDispatcher implements LogAggregationEngine {

    private final LogMetaDataService logMetaDataService;
    private final Set<LogLineParser> lineParsers;
    private final ExecutionContextManager contextManager;

    public LogAggregationDispatcher(LogMetaDataService logMetaDataService) {
        this.logMetaDataService = logMetaDataService;
        this.lineParsers = registerParsers();
        this.contextManager = new SimpleExecutionContextManager();
    }

    @Override
    public void processLine(String executionId, String line) {
        findParser(line).ifPresentOrElse(parser -> {
            ParsedLogLine parsed = parser.parse(line);

            contextManager.track(executionId, parsed)
                    .ifPresent(logMetaDataService::save);
        }, () -> {
            contextManager.cleanUp(executionId);

            throw new RuntimeException("No parser found for the log line: %s".formatted(line));
        });
    }

    private Optional<LogLineParser> findParser(String line) {
        return lineParsers.stream()
                .filter(x -> x.supports(line))
                .findFirst();
    }

    private Set<LogLineParser> registerParsers() {
        Set<LogLineParser> parsers = new HashSet<>();

        // TODO: OC-1086, Register parsers here

        return parsers;
    }
}