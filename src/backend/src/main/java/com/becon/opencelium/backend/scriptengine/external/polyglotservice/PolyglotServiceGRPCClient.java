package com.becon.opencelium.backend.scriptengine.external.polyglotservice;

import com.becon.opencelium.backend.proto.ScriptRequest;
import com.becon.opencelium.backend.proto.ScriptResult;
import io.grpc.Status;
import io.grpc.StatusRuntimeException;
import io.grpc.health.v1.HealthCheckRequest;
import io.grpc.health.v1.HealthCheckResponse;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.stereotype.Component;

@Component
public class PolyglotServiceGRPCClient {

    private static final Logger log = LoggerFactory.getLogger(PolyglotServiceGRPCClient.class);
    private static final int MAX_RETRY_ATTEMPTS = 2;

    private final GrpcClientConnectConfigurer configurer;

    public PolyglotServiceGRPCClient(GrpcClientConnectConfigurer configurer) {
        this.configurer = configurer;
    }

    /**
     * Execute script with automatic retry on connection failures
     */
    public ScriptResult execute(ScriptRequest request) {
        int attempts = 0;
        StatusRuntimeException lastException = null;

        while (attempts < MAX_RETRY_ATTEMPTS) {
            try {
                log.debug("Executing script (attempt {})", attempts + 1);
                return configurer.getBlockingStub().execute(request);

            } catch (StatusRuntimeException e) {
                lastException = e;
                attempts++;

                // Check if error is recoverable
                if (isRecoverableError(e) && attempts < MAX_RETRY_ATTEMPTS) {
                    log.warn("Recoverable gRPC error on attempt {}: {}. Resetting channel and retrying...",
                            attempts, e.getStatus());
                    configurer.resetChannel();

                    // Brief pause before retry
                    try {
                        Thread.sleep(100L * attempts);
                    } catch (InterruptedException ie) {
                        Thread.currentThread().interrupt();
                        break;
                    }
                } else {
                    log.error("Non-recoverable gRPC error or max attempts reached: {}", e.getStatus());
                    break;
                }
            }
        }

        throw new RuntimeException("Failed to execute script after " + attempts + " attempts", lastException);
    }

    /**
     * Check if service is up and running
     */
    public boolean isUp() {
        if (!configurer.isEnabled()) {
            return false;
        }

        try {
            HealthCheckRequest request = HealthCheckRequest.newBuilder().build();
            HealthCheckResponse response = configurer.getHealthStub().check(request);
            boolean isServing = response.getStatus() == HealthCheckResponse.ServingStatus.SERVING;

            if (!isServing) {
                log.debug("Service health check returned: {}", response.getStatus());
            }

            return isServing;

        } catch (StatusRuntimeException e) {
            log.debug("Health check failed: {} - {}", e.getStatus().getCode(), e.getMessage());

            // Reset channel on connection errors to ensure fresh connection next time
            if (isRecoverableError(e)) {
                configurer.resetChannel();
            }

            return false;
        } catch (Exception e) {
            log.debug("Health check failed with unexpected error: {}", e.getMessage());
            return false;
        }
    }

    /**
     * Determine if error is recoverable (connection-related)
     */
    private boolean isRecoverableError(StatusRuntimeException e) {
        Status.Code code = e.getStatus().getCode();
        return code == Status.Code.UNAVAILABLE
                || code == Status.Code.DEADLINE_EXCEEDED
                || code == Status.Code.CANCELLED
                || code == Status.Code.UNKNOWN;
    }
}