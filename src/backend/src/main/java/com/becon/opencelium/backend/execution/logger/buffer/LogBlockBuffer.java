package com.becon.opencelium.backend.execution.logger.buffer;

import com.becon.opencelium.backend.database.mongodb.entity.LogDataMng;

import java.util.List;
import java.util.Optional;

public interface LogBlockBuffer {

    /**
     * Add a block to the buffer and return a batch ready to flush
     * if the threshold is reached, otherwise an empty list.
     */
    List<LogDataMng> buffer(LogDataMng block);

    /**
     * Find an existing block in the in-memory buffer (if any).
     */
    Optional<LogDataMng> findInBuffer(LogDataMng example);

    /**
     * Explicit flush (e.g., on shutdown).
     */
    List<LogDataMng> flushAll();
}
