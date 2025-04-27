package com.becon.opencelium.backend.execution.log_managing;

import com.becon.opencelium.backend.database.mongodb.entity.LogMetaData;
import com.becon.opencelium.backend.execution.log_managing.commons.LogProcessingException;
import com.becon.opencelium.backend.execution.log_managing.commons.LogTrackerType;
import com.becon.opencelium.backend.execution.log_managing.core.ExecutionContextManager;
import com.becon.opencelium.backend.execution.log_managing.core.LogElementTracker;
import com.becon.opencelium.backend.execution.log_managing.core.ParsedLogLine;
import com.becon.opencelium.backend.utility.IndexPathUtils;

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
        executionContexts.put(executionId, new ExecutionContext(parsedLog.getSize()));
    }

    private Optional<LogMetaData> processExecution(String executionId, ParsedLogLine parsedLog) {
        LogTrackerType trackerType = LogTrackerType.fromLogEntry(parsedLog.getEntryType());
        if (parsedLog.getEntryType().isStartingNewStack()) {
            ExecutionContext executionContext = executionContexts.get(executionId);

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
                return Optional.of(tracker.onEnd(parsedLog));
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

        private ExecutionContext(Long currentOffset) {
            this.currentOffset = new AtomicLong(currentOffset);
        }
    }

    private static class ElementsLinkedList<E> {
        private Node<E> head;
        private Node<E> tail;

        public ElementsLinkedList(String indexPath, E data) {
            head = new Node<>(null, null, indexPath, data);
            tail = head;
        }

        public void addLast(String indexPath, E data) {
            if (Objects.isNull(head)) {
                head = new Node<>(null, null, indexPath, data);
                tail = head;
                return;
            }

            if (IndexPathUtils.compare(tail.indexPath, indexPath) >= 0) {
                List<String> paths = walkAndCollectIndexPath(head);
                paths.add(indexPath);
                throw LogProcessingException.wrongIndexPathSequenceFound(paths);
            }

            Node<E> newNode = new Node<>(null, null, indexPath, data);
            tail.next = newNode;
            newNode.prev = tail;
        }

        private List<String> walkAndCollectIndexPath(Node<E> head) {
            if (Objects.isNull(head)) {
                return Collections.emptyList();
            }

            List<String> paths = new ArrayList<>();
            Node<E> dummy = head;
            while (dummy != null) {
                paths.add(dummy.indexPath);
                dummy = dummy.next;
            }
            return paths;
        }

        public E searchAndGetData(String indexPath) {
            Node<E> dummmy = head;
            while (dummmy != null) {
                if (Objects.equals(dummmy.indexPath, indexPath)) {
                    return dummmy.data;
                }
                dummmy = dummmy.next;
            }
            return null;
        }

        public void dropLast() {
            Node<E> prev = tail.prev;
            if (Objects.isNull(prev)) {
                head = null;
                tail = null;
            }
            prev.next = null;
            tail = prev;
        }
    }

    private static class Node<E> {
        private Node<E> next;
        private Node<E> prev;
        private final String indexPath;
        private final E data;

        public Node(Node<E> next, Node<E> prev, String indexPath, E data) {
            this.next = next;
            this.prev = prev;
            this.indexPath = indexPath;
            this.data = data;
        }
    }
}