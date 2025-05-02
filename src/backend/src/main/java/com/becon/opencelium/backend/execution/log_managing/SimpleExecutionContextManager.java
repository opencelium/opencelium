package com.becon.opencelium.backend.execution.log_managing;

import com.becon.opencelium.backend.database.mongodb.entity.LogMetaData;
import com.becon.opencelium.backend.execution.log_managing.commons.ElementsLinkedList;
import com.becon.opencelium.backend.execution.log_managing.commons.LogPropertyKeys;
import com.becon.opencelium.backend.execution.log_managing.commons.LogProcessingException;
import com.becon.opencelium.backend.execution.log_managing.commons.LogTrackerType;
import com.becon.opencelium.backend.execution.log_managing.core.ExecutionContextManager;
import com.becon.opencelium.backend.execution.log_managing.core.LogElementTracker;
import com.becon.opencelium.backend.execution.log_managing.core.ParsedLogLine;
import com.becon.opencelium.backend.execution.log_managing.trackers.LogTrackerFactory;

import java.nio.charset.StandardCharsets;
import java.util.*;
import java.util.concurrent.ConcurrentHashMap;
import java.util.concurrent.atomic.AtomicLong;

public class SimpleExecutionContextManager implements ExecutionContextManager {
    private final Map<String, ElementsLinkedList<LogElementTracker>> trackersList = new ConcurrentHashMap<>();
    private final Map<String, ExecutionContext> executionContexts = new ConcurrentHashMap<>();

    @Override
    public synchronized Optional<LogMetaData> track(String executionId, ParsedLogLine parsedLog) {
        switch (parsedLog.getEntryType()) {
            case EXECUTION_START -> {
                initNewExecution(executionId, parsedLog);
                return Optional.empty();
            }
            case EXECUTION_END -> {
                cleanUp(executionId);
                return Optional.empty();
            }
            default -> {
                return processExecution(executionId, parsedLog);
            }
        }
    }

    @Override
    public void cleanUp(String execId) {
        executionContexts.remove(execId);
        trackersList.remove(execId);
    }

    @Override
    public synchronized void tryHandleNotStructuredLine(String executionId, String line) {
        ExecutionContext executionContext = Optional.ofNullable(executionContexts.get(executionId))
                .orElseThrow(() -> LogProcessingException.noExecutionInitialized(executionId));

        ElementsLinkedList<LogElementTracker> root = Optional.ofNullable(trackersList.get(executionId))
                .orElseThrow(() -> LogProcessingException.noExecutionInitialized(executionId));

        LogElementTracker tracker = Optional.ofNullable(root.getLastData())
                .orElseThrow(() -> LogProcessingException.noTrackerInitialized(line));

        tracker.onNotStructuredLine(line);
        executionContext.currentOffset.getAndUpdate(x -> x + line.getBytes(StandardCharsets.UTF_8).length);
    }

    private void initNewExecution(String executionId, ParsedLogLine parsedLog) {
        String connectionId = (String) parsedLog.getProperties().get(LogPropertyKeys.CONNECTION_ID);
        String flowchartId = (String) parsedLog.getProperties().get(LogPropertyKeys.FLOWCHART_ID);
        executionContexts.put(executionId, new ExecutionContext(parsedLog.getSize(), connectionId, flowchartId));
    }

    private Optional<LogMetaData> processExecution(String executionId, ParsedLogLine parsedLog) {
        LogTrackerType trackerType = LogTrackerType.fromLogEntry(parsedLog.getEntryType());

        ExecutionContext executionContext = Optional.ofNullable(executionContexts.get(executionId))
                .orElseThrow(() -> LogProcessingException.noExecutionInitialized(executionId));

        if (parsedLog.getEntryType().isStartingNewStack()) {
            LogElementTracker tracker = LogTrackerFactory.initTracker(trackerType);
            tracker.onStart(parsedLog, executionContext.currentOffset.get());

            executionContext.currentOffset.getAndUpdate(x -> x + parsedLog.getSize());

            if (trackersList.containsKey(executionId)) {
                trackersList.get(executionId).addLast(parsedLog.getIndexPath(), tracker);
            } else {
                trackersList.put(executionId, new ElementsLinkedList<>(parsedLog.getIndexPath(), tracker));
            }
            return Optional.empty();
        } else {
            ElementsLinkedList<LogElementTracker> root = Optional.ofNullable(trackersList.get(executionId))
                    .orElseThrow(() -> LogProcessingException.noExecutionInitialized(executionId));

            LogElementTracker tracker = Optional.ofNullable(root.getLastData())
                    .orElseThrow(() -> LogProcessingException.noTrackerInitialized(parsedLog.getEntryType(), parsedLog.getIndexPath()));

            executionContext.currentOffset.getAndUpdate(x -> x + parsedLog.getSize());

            if (parsedLog.getEntryType().isEndingStack()) {
                root.dropLast();
                LogMetaData metaData = tracker.onEnd(parsedLog);
                metaData.setExecutionId(executionId);
                metaData.setConnectionId(executionContext.connectionId);
                metaData.setFlowchartId(executionContext.flowchartId);
                metaData.setParentPath(root.getLastIndexPath());
                metaData.setEndOffset(executionContext.currentOffset.get());
                return Optional.of(metaData);
            } else {
                tracker.onContent(parsedLog);
                return Optional.empty();
            }
        }
    }

    private static class ExecutionContext {
        private final AtomicLong currentOffset;
        private final String connectionId;
        private final String flowchartId;

        private ExecutionContext(Long currentOffset, String connectionId, String flowchartId) {
            this.currentOffset = new AtomicLong(currentOffset);
            this.connectionId = connectionId;
            this.flowchartId = flowchartId;
        }
    }
}