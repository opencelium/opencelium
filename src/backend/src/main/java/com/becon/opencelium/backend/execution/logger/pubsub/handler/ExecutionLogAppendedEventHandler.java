package com.becon.opencelium.backend.execution.logger.pubsub.handler;

import com.becon.opencelium.backend.execution.logger.dto.LogDataDTO;
import com.becon.opencelium.backend.execution.logger.pubsub.Execution2MetadataMapping;
import com.becon.opencelium.backend.execution.logger.pubsub.event.ExecutionEvent;
import com.becon.opencelium.backend.execution.logger.pubsub.event.ExecutionLogAppendedEvent;
import com.becon.opencelium.backend.execution.socket.WebSocketNotificationService;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.stereotype.Component;

import java.io.IOException;
import java.nio.ByteBuffer;
import java.nio.channels.FileChannel;
import java.nio.charset.StandardCharsets;
import java.util.Optional;

@Component
public class ExecutionLogAppendedEventHandler implements ExecutionEventHandler {
    private final WebSocketNotificationService webSocket;
    private final Execution2MetadataMapping metadata;
    private static final Logger logger = LoggerFactory.getLogger(ExecutionLogAppendedEventHandler.class);

    public ExecutionLogAppendedEventHandler(
            WebSocketNotificationService webSocket,
            Execution2MetadataMapping metadata
    ) {
        this.webSocket = webSocket;
        this.metadata = metadata;
    }

    @Override
    public boolean supports(ExecutionEvent event) {
        return event instanceof ExecutionLogAppendedEvent;
    }

    @Override
    public void handle(ExecutionEvent event) {
        ExecutionLogAppendedEvent e = (ExecutionLogAppendedEvent) event;

        long executionId = e.executionId();

        if (!metadata.exists(executionId)) {
            // e.g. a line published after the execution finished and its metadata was
            // removed — nothing to route it to, but it must not poison the consumer
            logger.warn("Skipping log line for unknown executionId = {}", executionId);
            return;
        }

        String line = readLine(executionId, e.startOffset(), e.endOffset());

        Optional<LogDataDTO> logData = metadata.getDispatcher(executionId).dispatch(line, e.startOffset(), e.endOffset());
        if (logData.isPresent()) {
            webSocket.send(metadata.getConnectionId(executionId), logData);
        }
    }

    private String readLine(long executionId, long startOffset, long endOffset) {
        FileChannel channel = metadata.getChannel(executionId);
        long size = endOffset - startOffset;
        if (channel == null || size <= 0) {
            return "";
        }

        try {
            ByteBuffer buffer = ByteBuffer.allocate((int) size);

            channel.read(buffer, startOffset);
            buffer.flip();

            return StandardCharsets.UTF_8.decode(buffer).toString();
        } catch (IOException e) {
            // an unreadable line (file moved, channel closed concurrently) costs one
            // log entry; rethrowing would cost the whole event pipeline
            logger.warn("Failed to read log line: executionId: {}, startOffset: {}, endOffset: {}", executionId, startOffset, endOffset, e);
            return "";
        }
    }
}
