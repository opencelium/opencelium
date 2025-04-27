package com.becon.opencelium.backend.execution.log_managing;

import com.becon.opencelium.backend.database.mongodb.entity.LogMetaData;
import com.becon.opencelium.backend.execution.log_managing.commons.ElementsLinkedList;
import com.becon.opencelium.backend.execution.log_managing.commons.LogConstants;
import com.becon.opencelium.backend.execution.log_managing.commons.LogProcessingException;
import com.becon.opencelium.backend.execution.log_managing.commons.LogTrackerType;
import com.becon.opencelium.backend.execution.log_managing.core.ExecutionContextManager;
import com.becon.opencelium.backend.execution.log_managing.core.LogElementTracker;
import com.becon.opencelium.backend.execution.log_managing.core.ParsedLogLine;

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

    private void initNewExecution(String executionId, ParsedLogLine parsedLog) {
        String connectionId = (String) parsedLog.getProperties().get(LogConstants.CONNECTION_ID);
        String flowchartId = (String) parsedLog.getProperties().get(LogConstants.FLOWCHART_ID);
        executionContexts.put(executionId, new ExecutionContext(parsedLog.getSize(), connectionId, flowchartId));
    }

    private Optional<LogMetaData> processExecution(String executionId, ParsedLogLine parsedLog) {
        LogTrackerType trackerType = LogTrackerType.fromLogEntry(parsedLog.getEntryType());
        ExecutionContext executionContext = executionContexts.get(executionId);
        if (parsedLog.getEntryType().isStartingNewStack()) {

            LogElementTracker tracker = null; // TODO : initialize tracker, OC-1088
            tracker.onStart(parsedLog, executionContext.currentOffset.get());

            executionContext.currentOffset.getAndUpdate(x -> x + parsedLog.getSize());

            trackersList.computeIfAbsent(executionId, id -> new ElementsLinkedList<>(parsedLog.getIndexPath(), tracker))
                    .addLast(parsedLog.getIndexPath(), tracker);

            return Optional.empty();
        } else {
            ElementsLinkedList<LogElementTracker> root = Optional.ofNullable(trackersList.get(executionId))
                    .orElseThrow(() -> LogProcessingException.noExecutionInitialized(executionId));

            LogElementTracker tracker = Optional.ofNullable(root.searchAndGetData(parsedLog.getIndexPath()))
                    .orElseThrow(() -> LogProcessingException.noTrackerInitialized(parsedLog.getEntryType(), parsedLog.getIndexPath()));

            if (parsedLog.getEntryType().isEndingStack()) {
                root.dropLast();
                LogMetaData metaData = tracker.onEnd(parsedLog);
                metaData.setExecutionId(executionId);
                metaData.setConnectionId(executionContext.connectionId);
                metaData.setFlowchartId(executionContext.flowchartId);
                metaData.setParentPath(root.getLastIndexPath());
                return Optional.of(metaData);
            } else {
                executionContexts.get(executionId).currentOffset.getAndUpdate(x -> x + parsedLog.getSize());
                tracker.onContent(parsedLog);
                return Optional.empty();
            }
        }
    }

    @Override
    public void cleanUp(String execId) {
        executionContexts.remove(execId);
        trackersList.remove(execId);
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

    @Override
    public void tryHandleNotStructuredLine(String executionId, String line) {

    }
}