package com.becon.opencelium.backend.execution.logger.buffer;

import com.becon.opencelium.backend.database.mongodb.entity.LogDataMng;

import java.util.*;

public class InMemoryLogBlockBuffer implements LogBlockBuffer {
    private final int batchSize;
    private final LogBlockKeyExtractor keyExtractor;

    // buffer + index
    private final List<LogDataMng> buffer;
    private final Map<String, LogDataMng> index;

    public InMemoryLogBlockBuffer(int batchSize, LogBlockKeyExtractor keyExtractor) {
        this.batchSize = batchSize;
        this.keyExtractor = keyExtractor;
        this.buffer = new ArrayList<>(batchSize);
        this.index = new HashMap<>(batchSize * 2);
    }

    @Override
    public synchronized List<LogDataMng> buffer(LogDataMng block) {
        String key = keyExtractor.extractKey(block);
        buffer.add(block);
        index.put(key, block);

        if (buffer.size() >= batchSize) {
            return flushInternal();
        }
        return List.of();
    }

    @Override
    public synchronized Optional<LogDataMng> findInBuffer(LogDataMng example) {
        String key = keyExtractor.extractKey(example);
        return Optional.ofNullable(index.get(key));
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
        index.clear();
        return copy;
    }
}
