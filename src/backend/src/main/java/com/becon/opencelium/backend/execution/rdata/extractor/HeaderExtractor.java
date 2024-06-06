package com.becon.opencelium.backend.execution.rdata.extractor;

import com.becon.opencelium.backend.database.mysql.entity.RequestData;
import com.becon.opencelium.backend.invoker.entity.FunctionInvoker;

import java.util.List;
import java.util.Optional;

public class HeaderExtractor implements Extractor {

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
        return Optional.empty();
    }
}
