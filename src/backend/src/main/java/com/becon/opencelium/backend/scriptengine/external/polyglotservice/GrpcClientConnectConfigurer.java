package com.becon.opencelium.backend.scriptengine.external.polyglotservice;

import com.becon.opencelium.backend.constant.props.PolyglotProps;
import com.becon.opencelium.backend.proto.ExternalConsumerGrpc;
import io.grpc.ConnectivityState;
import io.grpc.ManagedChannel;
import io.grpc.ManagedChannelBuilder;
import io.grpc.health.v1.HealthGrpc;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.stereotype.Component;

import javax.annotation.PreDestroy;
import java.util.Objects;
import java.util.concurrent.TimeUnit;

@Component
public class GrpcClientConnectConfigurer {

    private static final Logger log = LoggerFactory.getLogger(GrpcClientConnectConfigurer.class);

    private volatile ManagedChannel managedChannel;
    private final PolyglotProps polyglotProps;
    private final Object lock = new Object();

    public GrpcClientConnectConfigurer(PolyglotProps polyglotProps) {
        this.polyglotProps = polyglotProps;
    }

    /**
     * Get or create channel with health check
     */
    private ManagedChannel getOrCreateChannel() {
        if (!polyglotProps.isEnabled() || !Objects.equals(polyglotProps.getProtocol(), "grpc")) {
            throw new IllegalStateException("Polyglot service is not enabled or not configured for gRPC");
        }

        // Check if channel needs recreation
        if (shouldRecreateChannel()) {
            synchronized (lock) {
                if (shouldRecreateChannel()) {
                    closeExistingChannel();
                    try {
                        managedChannel = createChannel();
                        log.info("Created new gRPC channel to {}:{}", polyglotProps.getHost(), polyglotProps.getPort());
                    } catch (Exception e) {
                        log.error("Failed to create gRPC channel to {}:{}",
                                polyglotProps.getHost(), polyglotProps.getPort(), e);
                        managedChannel = null;
                    }
                }
            }
        }

        return managedChannel;
    }

    /**
     * Determine if channel should be recreated
     */
    private boolean shouldRecreateChannel() {
        if (managedChannel == null) {
            return true;
        }

        ConnectivityState state = managedChannel.getState(false);
        boolean isUnhealthy = state == ConnectivityState.SHUTDOWN
                || state == ConnectivityState.TRANSIENT_FAILURE;

        if (isUnhealthy) {
            log.warn("Channel in unhealthy state: {}, will recreate", state);
        }

        return managedChannel.isShutdown() || managedChannel.isTerminated() || isUnhealthy;
    }

    /**
     * Close existing channel gracefully
     */
    private void closeExistingChannel() {
        if (managedChannel != null && !managedChannel.isShutdown()) {
            try {
                managedChannel.shutdown();
                if (!managedChannel.awaitTermination(2, TimeUnit.SECONDS)) {
                    managedChannel.shutdownNow();
                }
            } catch (InterruptedException e) {
                managedChannel.shutdownNow();
                Thread.currentThread().interrupt();
            }
        }
    }

    /**
     * Create new channel with retry and keepalive
     */
    private ManagedChannel createChannel() {
        return ManagedChannelBuilder
                .forAddress(polyglotProps.getHost(), polyglotProps.getPort())
                .usePlaintext()
                .enableRetry()
                .maxRetryAttempts(3)
                .keepAliveTime(2, TimeUnit.MINUTES)
                .keepAliveTimeout(20, TimeUnit.SECONDS)
                .keepAliveWithoutCalls(false)
                .idleTimeout(10, TimeUnit.MINUTES)
                .build();
    }

    /**
     * Get blocking stub (creates/recreates channel if needed)
     */
    public ExternalConsumerGrpc.ExternalConsumerBlockingStub getBlockingStub() {
        return ExternalConsumerGrpc.newBlockingStub(getOrCreateChannel());
    }

    /**
     * Get health stub (creates/recreates channel if needed)
     */
    public HealthGrpc.HealthBlockingStub getHealthStub() {
        return HealthGrpc.newBlockingStub(getOrCreateChannel());
    }

    /**
     * Check if service is configured and available
     */
    public boolean isEnabled() {
        return polyglotProps.isEnabled() && Objects.equals(polyglotProps.getProtocol(), "grpc");
    }

    /**
     * Force channel recreation (useful for recovery)
     */
    public void resetChannel() {
        synchronized (lock) {
            log.info("Force resetting gRPC channel");
            closeExistingChannel();
            managedChannel = null;
        }
    }

    /**
     * Cleanly shut down channel on app stop
     */
    @PreDestroy
    public void shutdown() {
        synchronized (lock) {
            closeExistingChannel();
            log.info("gRPC channel shut down");
        }
    }
}