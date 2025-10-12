package com.becon.opencelium.backend.scriptengine.external.polyglotservice;

import com.becon.opencelium.backend.constant.props.PolyglotProps;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.DisposableBean;

import jakarta.annotation.PreDestroy;
import java.io.BufferedReader;
import java.io.IOException;
import java.io.InputStreamReader;
import java.util.ArrayList;
import java.util.List;
import java.util.concurrent.TimeUnit;

public class PolyglotServiceManager implements DisposableBean {

    private static final Logger logger = LoggerFactory.getLogger(PolyglotServiceManager.class);

    private final PolyglotProps props;
    private Process polyglotProcess;
    private volatile boolean isRunning = false;

    public PolyglotServiceManager(PolyglotProps props) {
        this.props = props;
        registerShutdownHook();
    }

    private void registerShutdownHook() {
        Runtime.getRuntime().addShutdownHook(new Thread(() -> {
            if (isRunning) {
                logger.info("Shutdown hook triggered - stopping Polyglot service");
                cleanup();
            }
        }, "polyglot-shutdown-hook"));
    }

    public void start() throws PolyglotStartupException {
        if (!props.isEnabled() || !props.isAutoStart()) {
            logger.info("Polyglot service auto-start is disabled");
            return;
        }

        if (isRunning) {
            logger.warn("Polyglot service is already running");
            return;
        }

        logger.info("Starting Polyglot service from: {}", props.getJarPath());

        try {
            polyglotProcess = startProcess();
            waitForServiceStart();
            isRunning = true;

            logger.info("Polyglot service started successfully on {}://{}:{}",
                    props.getProtocol(), props.getHost(), props.getPort());

        } catch (Exception e) {
            cleanup();
            throw new PolyglotStartupException("Failed to start Polyglot service", e);
        }
    }

    private Process startProcess() throws IOException {
        List<String> command = buildCommand();

        logger.debug("Starting process with command: {}", String.join(" ", command));

        ProcessBuilder processBuilder = new ProcessBuilder(command);
        processBuilder.redirectErrorStream(true);

        Process process = processBuilder.start();

        // Start a thread to log output
        startOutputLogger(process);

        return process;
    }

    private List<String> buildCommand() {
        List<String> command = new ArrayList<>();
        command.add("java");

        // Add JVM arguments
        if (props.getJvmArgs() != null && !props.getJvmArgs().trim().isEmpty()) {
            String[] jvmArgs = props.getJvmArgs().trim().split("\\s+");
            for (String arg : jvmArgs) {
                command.add(arg);
            }
        }

        command.add("-jar");
        command.add(props.getJarPath());

        // Add application arguments
        if (props.getArgs() != null && !props.getArgs().trim().isEmpty()) {
            String[] args = props.getArgs().trim().split("\\s+");
            for (String arg : args) {
                command.add(arg);
            }
        }

        return command;
    }

    private void startOutputLogger(Process process) {
        Thread loggerThread = new Thread(() -> {
            try (BufferedReader reader = new BufferedReader(
                    new InputStreamReader(process.getInputStream()))) {
                String line;
                while ((line = reader.readLine()) != null) {
                    logger.info("[Polyglot] {}", line);
                }
            } catch (IOException e) {
                logger.error("Error reading Polyglot process output", e);
            }
        });
        loggerThread.setDaemon(true);
        loggerThread.setName("polyglot-output-logger");
        loggerThread.start();
    }

    private void waitForServiceStart() throws PolyglotStartupException {
        logger.info("Waiting for Polyglot service to start (timeout: {}s)",
                props.getWaitTimeoutSec());

        long startTime = System.currentTimeMillis();
        long timeoutMillis = props.getWaitTimeoutSec() * 1000L;

        while (System.currentTimeMillis() - startTime < timeoutMillis) {
            if (!polyglotProcess.isAlive()) {
                throw new PolyglotStartupException("Polyglot process terminated unexpectedly");
            }

            if (isPortListening()) {
                logger.info("Polyglot service port is available at {}:{}", props.getHost(), props.getPort());
                return;
            }

            try {
                Thread.sleep(1000);
            } catch (InterruptedException e) {
                Thread.currentThread().interrupt();
                throw new PolyglotStartupException("Startup wait interrupted", e);
            }
        }

        throw new PolyglotStartupException(
                "Polyglot service failed to start within " + props.getWaitTimeoutSec() + " seconds");
    }

    private boolean isPortListening() {
        try {
            java.net.Socket socket = new java.net.Socket();
            socket.connect(new java.net.InetSocketAddress(props.getHost(), props.getPort()), 2000);
            socket.close();
            return true;
        } catch (Exception e) {
            logger.trace("Port {}:{} not available yet: {}", props.getHost(), props.getPort(), e.getMessage());
            return false;
        }
    }

    public boolean isRunning() {
        return isRunning && polyglotProcess != null && polyglotProcess.isAlive();
    }

    @PreDestroy
    @Override
    public void destroy() {
        stop();
    }

    public void stop() {
        if (polyglotProcess == null || !isRunning) {
            return;
        }

        logger.info("Stopping Polyglot service...");

        cleanup();

        logger.info("Polyglot service stopped");
    }

    private void cleanup() {
        isRunning = false;

        if (polyglotProcess == null) {
            return;
        }

        try {
            // Try graceful shutdown first
            polyglotProcess.destroy();

            boolean terminated = polyglotProcess.waitFor(10, TimeUnit.SECONDS);

            if (!terminated) {
                logger.warn("Polyglot service did not terminate gracefully, forcing shutdown");
                polyglotProcess.destroyForcibly();
                polyglotProcess.waitFor(5, TimeUnit.SECONDS);
            }
        } catch (InterruptedException e) {
            Thread.currentThread().interrupt();
            logger.error("Interrupted while stopping Polyglot service", e);
            polyglotProcess.destroyForcibly();
        } finally {
            polyglotProcess = null;
        }
    }

    public static class PolyglotStartupException extends Exception {
        public PolyglotStartupException(String message) {
            super(message);
        }

        public PolyglotStartupException(String message, Throwable cause) {
            super(message, cause);
        }
    }
}