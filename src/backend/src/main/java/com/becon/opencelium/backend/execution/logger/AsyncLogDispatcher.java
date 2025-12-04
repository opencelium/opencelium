package com.becon.opencelium.backend.execution.logger;

import java.util.concurrent.BlockingQueue;
import java.util.concurrent.LinkedBlockingQueue;

public class AsyncLogDispatcher implements AutoCloseable {
    private final BlockingQueue<Runnable> queue;
    private final Thread worker;
    private volatile boolean running = true;

    public AsyncLogDispatcher(String threadName) {
        this.queue = new LinkedBlockingQueue<>();
        this.worker = new Thread(this::processLoop, threadName);
        this.worker.start();
    }

    public void submit(Runnable task) {
        if (!running) {
            return;
        }
        queue.offer(task);
    }

    private void processLoop() {
        try {
            while (running || !queue.isEmpty()) {
                Runnable task;
                try {
                    task = queue.take();
                } catch (InterruptedException ie) {
                    if (!running) {
                        break; // shutting down
                    }
                    continue;
                }

                try {
                    task.run();
                } catch (Exception e) {
                    e.printStackTrace();
                    // swallow or log somewhere, but don't kill the worker
                }
            }
        } finally {
            // optional: drain remaining tasks
            Runnable task;
            while ((task = queue.poll()) != null) {
                try {
                    task.run();
                } catch (Exception ignored) {
                    ignored.printStackTrace();
                }
            }
        }
    }

    @Override
    public void close() {
        running = false;
        worker.interrupt();
        try {
            worker.join();
        } catch (InterruptedException e) {
            Thread.currentThread().interrupt();
        }
    }
}
