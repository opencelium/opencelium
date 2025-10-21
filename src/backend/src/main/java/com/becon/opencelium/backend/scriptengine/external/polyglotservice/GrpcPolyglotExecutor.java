package com.becon.opencelium.backend.scriptengine.external.polyglotservice;

import com.becon.opencelium.backend.proto.ScriptRequest;
import com.becon.opencelium.backend.proto.ScriptResult;
import com.becon.opencelium.backend.scriptengine.ex.ScriptExecutionException;
import com.becon.opencelium.backend.scriptengine.external.ExternalScriptExecutor;
import org.springframework.stereotype.Component;

@Component
public class GrpcPolyglotExecutor implements ExternalScriptExecutor<ScriptRequest> {

    private final PolyglotServiceGRPCClient grpcClient;

    public GrpcPolyglotExecutor(PolyglotServiceGRPCClient grpcClient) {
        this.grpcClient = grpcClient;
    }

    @Override
    public Object execute(ScriptRequest input) {
        ScriptResult result = grpcClient.execute(input);

        return handleResult(result);
    }

    @Override
    public boolean isUp() {
        return grpcClient.isUp();
    }

    private Object handleResult(ScriptResult result) {
        if (result.getSuccess()) {
            return StructConverter.fromValue(result.getResult());
        } else {
            throw new ScriptExecutionException(result.getErrorCode() + "-" + result.getErrorMessage());
        }
    }
}
