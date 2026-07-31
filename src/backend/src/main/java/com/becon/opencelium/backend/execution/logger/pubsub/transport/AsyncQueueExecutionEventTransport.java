package com.becon.opencelium.backend.execution.logger.pubsub.transport;

import com.becon.opencelium.backend.execution.logger.pubsub.ExecutionEventConsumer;
import com.becon.opencelium.backend.execution.logger.pubsub.event.ExecutionEvent;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.context.annotation.Primary;
import org.springframework.stereotype.Component;

import java.util.concurrent.BlockingQueue;
import java.util.concurrent.ExecutorService;
import java.util.concurrent.Executors;
import java.util.concurrent.LinkedBlockingQueue;
import java.util.concurrent.TimeUnit;

@Primary
@Component
public class AsyncQueueExecutionEventTransport implements ExecutionEventTransport {
    private static final Logger logger = LoggerFactory.getLogger(AsyncQueueExecutionEventTransport.class);

    private final BlockingQueue<ExecutionEvent> queue = new LinkedBlockingQueue<>(100_000);
    private final ExecutorService executor = Executors.newSingleThreadExecutor();
    private final ExecutionEventConsumer consumer;

    private volatile State state = State.NEW;

    public AsyncQueueExecutionEventTransport(ExecutionEventConsumer consumer) {
        this.consumer = consumer;
    }

    @Override
    public synchronized void start() {
        if (state == State.RUNNING) {
            return;
        }

        if (state != State.NEW) {
            throw new IllegalStateException("Execution event transport cannot be restarted");
        }

        state = State.RUNNING;
        executor.submit(this::loop);
    }

    @Override
    public void accept(ExecutionEvent event) {
        if (state != State.RUNNING) {
            throw new IllegalStateException("Execution event transport is not running");
        }

        try {
            queue.put(event);
        } catch (InterruptedException e) {
            Thread.currentThread().interrupt();
        }
    }

    private void loop() {
        while (state == State.RUNNING || !queue.isEmpty()) {
            try {
                ExecutionEvent event = queue.take();
                try {
                    consumer.dispatch(event);
                } catch (Exception e) {
                    // a failing event must never kill the consumer thread: it is the only
                    // reader of the queue, so its death silences all executions until restart
                    logger.error("Failed to process execution event {}; event skipped", event, e);
                }
            } catch (InterruptedException e) {
                Thread.currentThread().interrupt();
            }
        }

        state = State.TERMINATED;
    }

    @Override
    public synchronized void stop() {
        if (state != State.RUNNING) {
            return;
        }

        state = State.STOPPING;
        executor.shutdown();

        try {
            if (!executor.awaitTermination(10, TimeUnit.SECONDS)) {
                logger.warn("Execution event transport did not stop gracefully; forcing shutdown");
                executor.shutdownNow();
            }
        } catch (InterruptedException e) {
            executor.shutdownNow();
            Thread.currentThread().interrupt();
        } finally {
            state = State.TERMINATED;
        }
    }

    private enum State {
        NEW,
        RUNNING,
        STOPPING,
        TERMINATED
    }
}
