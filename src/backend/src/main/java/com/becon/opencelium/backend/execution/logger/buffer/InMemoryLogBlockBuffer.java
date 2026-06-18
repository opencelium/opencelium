package com.becon.opencelium.backend.execution.logger.buffer;

import com.becon.opencelium.backend.database.mongodb.entity.LogDataMng;
import com.becon.opencelium.backend.execution.logger.enums.PhaseStatus;

import java.util.*;

public class InMemoryLogBlockBuffer implements LogBlockBuffer {
    private final int batchSize;
    private final LogBlockKeyExtractor keyExtractor;

    // buffer + index
    private final List<LogDataMng> buffer;
    private final Map<String, LogDataMng> blockByKey;
    private final Map<String, LogDataMng> blockById;

    public InMemoryLogBlockBuffer(int batchSize, LogBlockKeyExtractor keyExtractor) {
        this.batchSize = batchSize;
        this.keyExtractor = keyExtractor;
        this.buffer = new ArrayList<>(batchSize);
        this.blockByKey = new HashMap<>(batchSize * 2);
        this.blockById = new HashMap<>(batchSize);
    }

    @Override
    public synchronized List<LogDataMng> buffer(LogDataMng block) {
        String key = keyExtractor.extractKey(block);
        buffer.add(block);
        blockByKey.put(key, block);
        blockById.put(block.getId(), block);

        if (buffer.size() >= batchSize) {
            return flushInternal();
        }
        return List.of();
    }

    @Override
    public synchronized Optional<LogDataMng> findInBufferByKey(LogDataMng example) {
        String key = keyExtractor.extractKey(example);
        return Optional.ofNullable(blockByKey.get(key));
    }

    @Override
    public synchronized Optional<LogDataMng> findInBufferById(String elementId) {
        return Optional.ofNullable(blockById.get(elementId));
    }

    @Override
    public synchronized List<LogDataMng> findAllCompletedByExecutionId(String executionId) {
        return buffer.stream()
                .filter(block -> block.getStatus() == PhaseStatus.COMPLETE)
                .filter(block -> Objects.equals(block.getExecutionId(), executionId))
                .toList();
    }

    @Override
    public synchronized List<LogDataMng> flushAll() {
        if (buffer.isEmpty()) {
            return List.of();
        }
        return flushInternal();
    }

    private List<LogDataMng> flushInternal() {
        List<LogDataMng> copy = new ArrayList<>(buffer);
        buffer.clear();
        blockByKey.clear();
        blockById.clear();
        return copy;
    }
}
