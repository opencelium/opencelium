package com.becon.opencelium.backend.scriptengine.external.polyglotservice;

import com.becon.opencelium.backend.proto.ExternalConsumerGrpc;
import com.becon.opencelium.backend.proto.ScriptRequest;
import com.becon.opencelium.backend.proto.ScriptResult;
import jakarta.annotation.PostConstruct;
import org.springframework.stereotype.Component;

@Component
public class PolyglotServiceGRPCClient {

    private final GrpcClientConnectConfigurer grpcClientConnectConfigurer;
    private ExternalConsumerGrpc.ExternalConsumerBlockingStub blockingStub;

    public PolyglotServiceGRPCClient(GrpcClientConnectConfigurer grpcClientConnectConfigurer) {
        this.grpcClientConnectConfigurer = grpcClientConnectConfigurer;
    }

    @PostConstruct
    void init() {
        blockingStub = grpcClientConnectConfigurer.externalConsumerBlockingStub();
    }

    public ScriptResult execute(ScriptRequest request) {
        return blockingStub.execute(request);
    }

    public boolean isUp() {
        return blockingStub != null;
    }
}
