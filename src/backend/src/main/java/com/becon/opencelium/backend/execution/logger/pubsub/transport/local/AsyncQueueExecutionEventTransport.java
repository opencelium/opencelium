package com.becon.opencelium.backend.execution.logger.pubsub.transport.local;

import com.becon.opencelium.backend.execution.logger.pubsub.event.ExecutionEvent;
import com.becon.opencelium.backend.execution.logger.pubsub.transport.AbstractExecutionEventTransport;
import jakarta.annotation.PostConstruct;
import jakarta.annotation.PreDestroy;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.context.annotation.Primary;
import org.springframework.stereotype.Component;

import java.util.concurrent.BlockingQueue;
import java.util.concurrent.ExecutorService;
import java.util.concurrent.Executors;
import java.util.concurrent.LinkedBlockingQueue;

@Primary
@Component
public class AsyncQueueExecutionEventTransport extends AbstractExecutionEventTransport {
    private static final Logger logger = LoggerFactory.getLogger(AsyncQueueExecutionEventTransport.class);

    private final BlockingQueue<ExecutionEvent> queue = new LinkedBlockingQueue<>(100_000);
    private final ExecutorService executor = Executors.newSingleThreadExecutor();

    private volatile boolean running = true;

    @PostConstruct
    void init() {
        executor.submit(this::loop);
    }

    @Override
    public void accept(ExecutionEvent event) {
        try {
            queue.put(event);
        } catch (InterruptedException e) {
            Thread.currentThread().interrupt();
        }
    }

    private void loop() {
        while (running) {
            try {
                ExecutionEvent event = queue.take();
                try {
                    super.consume(event);
                } catch (Exception e) {
                    // a failing event must never kill the consumer thread: it is the only
                    // reader of the queue, so its death silences all executions until restart
                    logger.error("Failed to process execution event {}; event skipped", event, e);
                }
            } catch (InterruptedException e) {
                Thread.currentThread().interrupt();
            }
        }
    }

    @PreDestroy
    void stop() {
        running = false;
        executor.shutdownNow();
    }
}
