package com.becon.opencelium.backend.scriptengine.external.polyglotservice;

import com.becon.opencelium.backend.constant.props.PolyglotProps;
import com.becon.opencelium.backend.proto.ExternalConsumerGrpc;
import io.grpc.ClientInterceptors;
import io.grpc.ManagedChannel;
import io.grpc.ManagedChannelBuilder;
import org.springframework.stereotype.Component;

import javax.annotation.PreDestroy;
import java.util.Objects;
import java.util.concurrent.TimeUnit;

@Component
public class GrpcClientConnectConfigurer {

    private ManagedChannel managedChannel;
    private final PolyglotProps polyglotProps;

    public GrpcClientConnectConfigurer(PolyglotProps polyglotProps) {
        this.polyglotProps = polyglotProps;
    }

    // Create channel
    private ManagedChannel createChannel() {
        return ManagedChannelBuilder.forAddress(polyglotProps.getHost(), polyglotProps.getPort())
                .usePlaintext()
                .enableRetry()
                .maxRetryAttempts(3)
                .keepAliveTime(30, TimeUnit.SECONDS)           // keepalive pings every 30s
                .keepAliveTimeout(10, TimeUnit.SECONDS)        // wait up to 10s for keepalive ack
                .idleTimeout(1, TimeUnit.MINUTES)              // close channel if idle for 1 min
                .build();
    }

    /**
     * Blocking stub (synchronous)
     */
    public ExternalConsumerGrpc.ExternalConsumerBlockingStub externalConsumerBlockingStub() {

        if (polyglotProps.isEnabled() && Objects.equals(polyglotProps.getProtocol(), "grpc")) {
            managedChannel = null;
            return null;
        }

        if (managedChannel != null && !managedChannel.isShutdown()) {
            managedChannel.shutdownNow();
        }

        managedChannel = createChannel();

        return ExternalConsumerGrpc.newBlockingStub(
                ClientInterceptors.intercept(managedChannel)
        );
    }

    /**
     * Cleanly shut down channel on app stop
     */
    @PreDestroy
    public void shutdown() {
        if (managedChannel != null && !managedChannel.isShutdown()) {
            managedChannel.shutdown();
        }
    }
}
