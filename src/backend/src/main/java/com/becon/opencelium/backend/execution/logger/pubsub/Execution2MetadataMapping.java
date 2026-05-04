package com.becon.opencelium.backend.execution.logger.pubsub;

import com.becon.opencelium.backend.execution.logger.LogLineDispatcher;
import com.becon.opencelium.backend.utility.LogFileUtility;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.stereotype.Service;

import java.io.IOException;
import java.nio.channels.FileChannel;
import java.nio.file.Path;
import java.nio.file.StandardOpenOption;
import java.util.concurrent.ConcurrentHashMap;
import java.util.concurrent.ConcurrentMap;

@Service
public class Execution2MetadataMapping {
    private final ConcurrentMap<Long, Metadata> mapping = new ConcurrentHashMap<>();
    private static final Logger logger = LoggerFactory.getLogger(Execution2MetadataMapping.class);

    public long getConnectionId(Long executionId) {
        return require(executionId).connectionId;
    }

    public int getSchedulerId(Long executionId) {
        return require(executionId).schedulerId;
    }

    public String getTimestamp(Long executionId) {
        return require(executionId).timestamp;
    }

    public FileChannel getChannel(Long executionId) {
        return getOrOpenChannel(executionId);
    }

    public LogLineDispatcher getDispatcher(long executionId) {
        return require(executionId).dispatcher;
    }

    public void create(long executionId, long connectionId, int schedulerId, String timestamp) {
        mapping.putIfAbsent(executionId, new Metadata(executionId, connectionId, schedulerId, timestamp));
    }

    public void remove(long executionId) {
        Metadata metadata = mapping.remove(executionId);

        if (metadata != null && metadata.channel != null) {
            try {
                metadata.channel.close();
            } catch (IOException e) {
            }
        }
    }

    private FileChannel getOrOpenChannel(Long executionId) {
        Metadata metadata = require(executionId);

        if (metadata.channel != null) {
            return metadata.channel;
        }

        synchronized (metadata) {
            if (metadata.channel == null) {
                Path logFilePath = LogFileUtility.buildUncategorizedLogFilePath(metadata.timestamp, metadata.connectionId, metadata.executionId);

                try {
                    metadata.channel = FileChannel.open(logFilePath, StandardOpenOption.READ);
                } catch (IOException e) {
                    logger.warn("Cannot open channel for executionId = " + executionId, e);
                }
            }
        }

        return metadata.channel;
    }

    private Metadata require(long executionId) {
        Metadata metadata = mapping.get(executionId);
        if (metadata == null) {
            logger.error("Execution metadata not found for id=" + executionId);
        }

        return metadata;
    }


    private static class Metadata {
        final long executionId;
        final long connectionId;
        final int schedulerId;
        final String timestamp;
        final LogLineDispatcher dispatcher;
        volatile FileChannel channel;

        Metadata(long executionId, long connectionId, int schedulerId, String timestamp) {
            this.executionId = executionId;
            this.connectionId = connectionId;
            this.schedulerId = schedulerId;
            this.timestamp = timestamp;
            this.dispatcher = new LogLineDispatcher();
        }
    }
}
