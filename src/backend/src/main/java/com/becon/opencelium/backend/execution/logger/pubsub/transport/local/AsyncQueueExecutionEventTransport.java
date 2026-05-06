package com.becon.opencelium.backend.execution.logger.pubsub.transport.local;

import com.becon.opencelium.backend.execution.logger.pubsub.event.ExecutionEvent;
import com.becon.opencelium.backend.execution.logger.pubsub.transport.AbstractExecutionEventTransport;
import jakarta.annotation.PostConstruct;
import jakarta.annotation.PreDestroy;
import org.springframework.context.annotation.Primary;
import org.springframework.stereotype.Component;

import java.util.concurrent.BlockingQueue;
import java.util.concurrent.ExecutorService;
import java.util.concurrent.Executors;
import java.util.concurrent.LinkedBlockingQueue;

@Primary
@Component
public class AsyncQueueExecutionEventTransport extends AbstractExecutionEventTransport {
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
                super.consume(event);
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
