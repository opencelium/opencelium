package com.becon.opencelium.backend.execution.log_managing;

import com.becon.opencelium.backend.database.mongodb.service.LogMetaDataService;
import com.becon.opencelium.backend.execution.log_managing.core.ExecutionContextManager;
import com.becon.opencelium.backend.execution.log_managing.core.LogAggregationEngine;
import com.becon.opencelium.backend.execution.log_managing.core.LogLineParser;
import com.becon.opencelium.backend.execution.log_managing.core.ParsedLogLine;
import com.becon.opencelium.backend.execution.log_managing.parsers.*;
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
        try {
            findParser(line).ifPresentOrElse(parser -> {
                ParsedLogLine parsed = parser.parse(line);

                contextManager.track(executionId, parsed)
                        .ifPresent(logMetaDataService::save);
            }, () -> contextManager.tryHandleNotStructuredLine(executionId, line));
        } catch (Exception e) {
            contextManager.cleanUp(executionId);
            throw e;
        }
    }

    private Optional<LogLineParser> findParser(String line) {
        return lineParsers.stream()
                .filter(x -> x.supports(line))
                .findFirst();
    }

    private Set<LogLineParser> registerParsers() {
        Set<LogLineParser> parsers = new HashSet<>();
        parsers.add(new ExecutionStartParser());
        parsers.add(new ExecutionEndParser());
        parsers.add(new IfStartParser());
        parsers.add(new IfResultParser());
        parsers.add(new IfEndParser());
        parsers.add(new LoopStartParser());
        parsers.add(new LoopEndParser());
        parsers.add(new MethodStartParser());
        parsers.add(new MethodEndParser());
        parsers.add(new RequestParser());
        parsers.add(new RequestHeaderParser());
        parsers.add(new RequestPayloadParser());
        parsers.add(new ResponseParser());
        parsers.add(new ResponseHeaderParser());
        parsers.add(new ResponsePayloadParser());
        return parsers;
    }
}