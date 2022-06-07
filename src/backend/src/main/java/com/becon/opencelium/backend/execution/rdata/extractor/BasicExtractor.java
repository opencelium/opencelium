package com.becon.opencelium.backend.execution.rdata.extractor;

import com.becon.opencelium.backend.invoker.entity.FunctionInvoker;
import com.becon.opencelium.backend.mysql.entity.RequestData;

import java.util.Base64;
import java.util.List;
import java.util.Optional;

public class BasicExtractor implements Extractor {

    private List<RequestData> requestData;
    private List<FunctionInvoker> functionInvokers;

    @Override
    public Extractor setRequestData(List<RequestData> requestData) {
        this.requestData = requestData;
        return this;
    }

    @Override
    public Extractor setFunctions(List<FunctionInvoker> functionInvokerList) {
        this.functionInvokers = functionInvokerList;
        return this;
    }

    @Override
    public Optional<String> getValue(String fieldName) {
        String expr = requestData.stream()
                .filter(rq -> rq.getField().equals(fieldName))
                .map(RequestData::getValue).findFirst().orElse(null);
        if (expr == null) {
            return Optional.of("");
        }
        int openBrace = expr.indexOf("{") + 1;
        int closeBrace = expr.indexOf("}");
        String data = expr.substring(openBrace, closeBrace);
        String[] credentials = data.split(":");
        String username = requestData.stream()
                .filter(d -> d.getField().equals(credentials[0]))
                .findFirst()
                .orElseThrow(() -> new RuntimeException(credentials[0] + "property not found in request_data")).getValue();
        String password = requestData.stream()
                .filter(d -> d.getField().equals(credentials[1]))
                .findFirst()
                .orElseThrow(() -> new RuntimeException(credentials[1] + "property not found in request_data")).getValue();
        String authCode = "Basic " + Base64.getEncoder().encodeToString((username + ":" + password).getBytes());
        return Optional.of(authCode);
    }
}
