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

/**
 * Manages the lifecycle of an external Polyglot service running as a separate JVM process.
 * <p>
 * This manager is responsible for:
 * <ul>
 *   <li>Starting the Polyglot service JAR as a child process</li>
 *   <li>Monitoring the service health and availability</li>
 *   <li>Logging service output</li>
 *   <li>Gracefully shutting down the service on application exit</li>
 * </ul>
 * <p>
 * The service will only start if both {@code enabled} and {@code autoStart} are true
 * in the {@link PolyglotProps} configuration. If the service fails to start, the
 * application will fall back to the Nashorn JavaScript engine.
 * <p>
 * Thread Safety: This class is thread-safe. The {@code isRunning} flag is volatile
 * to ensure visibility across threads.
 *
 * @see PolyglotProps
 * @see PolyglotAutoConfiguration
 */
public class PolyglotServiceManager implements DisposableBean {

    private static final Logger logger = LoggerFactory.getLogger(PolyglotServiceManager.class);

    private final PolyglotProps props;
    private Process polyglotProcess;
    private volatile boolean isRunning = false;

    /**
     * Creates a new PolyglotServiceManager with the given configuration.
     * Registers a JVM shutdown hook to ensure graceful cleanup on application exit.
     *
     * @param props the Polyglot service configuration properties
     */
    public PolyglotServiceManager(PolyglotProps props) {
        this.props = props;
        registerShutdownHook();
    }

    /**
     * Registers a JVM shutdown hook to ensure the Polyglot service is stopped
     * when the application terminates, even in cases where Spring's normal
     * shutdown mechanisms don't execute (e.g., kill signal, JVM crash).
     */
    private void registerShutdownHook() {
        Runtime.getRuntime().addShutdownHook(new Thread(() -> {
            if (isRunning) {
                logger.info("Shutdown hook triggered - stopping Polyglot service");
                cleanup();
            }
        }, "polyglot-shutdown-hook"));
    }

    /**
     * Starts the Polyglot service as an external process.
     * <p>
     * This method will:
     * <ol>
     *   <li>Validate that the service is enabled and autoStart is true</li>
     *   <li>Build and execute the Java command to start the JAR</li>
     *   <li>Wait for the service port to become available</li>
     *   <li>Mark the service as running</li>
     * </ol>
     * <p>
     * If the service is already running, this method does nothing.
     * If the service fails to start, a {@link PolyglotStartupException} is thrown.
     *
     * @throws PolyglotStartupException if the service fails to start or times out
     */
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

    /**
     * Starts the Polyglot service process using ProcessBuilder.
     * Creates a background thread to continuously log the service's output.
     *
     * @return the started Process instance
     * @throws IOException if an I/O error occurs when starting the process
     */
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

    /**
     * Builds the command line arguments to start the Polyglot service JAR.
     * <p>
     * The command structure is:
     * {@code java [jvmArgs] -jar [jarPath] [args]}
     *
     * @return a list of command line arguments
     */
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

    /**
     * Starts a daemon thread that continuously reads and logs the output
     * from the Polyglot service process.
     * <p>
     * All output lines are prefixed with "[Polyglot]" for easy identification.
     *
     * @param process the process whose output should be logged
     */
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

    /**
     * Waits for the Polyglot service to become available by checking if its port is listening.
     * <p>
     * This method polls the service port every second until:
     * <ul>
     *   <li>The port becomes available (success)</li>
     *   <li>The process terminates unexpectedly (failure)</li>
     *   <li>The timeout period expires (failure)</li>
     * </ul>
     *
     * @throws PolyglotStartupException if the service fails to start within the timeout period
     *                                   or if the process terminates unexpectedly
     */
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

    /**
     * Checks if the Polyglot service port is listening and accepting connections.
     * <p>
     * Uses a TCP socket connection with a 2-second timeout to test availability.
     *
     * @return true if the port is accepting connections, false otherwise
     */
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

    /**
     * Checks if the Polyglot service is currently running.
     * <p>
     * A service is considered running if:
     * <ul>
     *   <li>The {@code isRunning} flag is true</li>
     *   <li>The process instance is not null</li>
     *   <li>The process is still alive</li>
     * </ul>
     *
     * @return true if the service is running, false otherwise
     */
    public boolean isRunning() {
        return isRunning && polyglotProcess != null && polyglotProcess.isAlive();
    }

    /**
     * Spring lifecycle method called when the bean is being destroyed.
     * Delegates to {@link #stop()} to ensure proper cleanup.
     */
    @PreDestroy
    @Override
    public void destroy() {
        stop();
    }

    /**
     * Stops the Polyglot service gracefully.
     * <p>
     * If the service is not running, this method does nothing.
     * Otherwise, it delegates to {@link #cleanup()} to terminate the process.
     */
    public void stop() {
        if (polyglotProcess == null || !isRunning) {
            return;
        }

        logger.info("Stopping Polyglot service...");

        cleanup();

        logger.info("Polyglot service stopped");
    }

    /**
     * Performs cleanup of the Polyglot service process.
     * <p>
     * This method attempts graceful shutdown first by calling {@link Process#destroy()},
     * waiting up to 10 seconds for termination. If the process doesn't terminate gracefully,
     * it forces termination using {@link Process#destroyForcibly()}.
     * <p>
     * Thread interruptions are handled by setting the interrupt flag and forcing termination.
     */
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

    /**
     * Exception thrown when the Polyglot service fails to start or times out during startup.
     * <p>
     * This exception is checked to force callers to handle startup failures explicitly,
     * typically by falling back to an alternative script engine (e.g., Nashorn).
     */
    public static class PolyglotStartupException extends Exception {

        /**
         * Creates a new exception with the specified message.
         *
         * @param message the detail message
         */
        public PolyglotStartupException(String message) {
            super(message);
        }

        /**
         * Creates a new exception with the specified message and cause.
         *
         * @param message the detail message
         * @param cause the cause of the exception
         */
        public PolyglotStartupException(String message, Throwable cause) {
            super(message, cause);
        }
    }
}