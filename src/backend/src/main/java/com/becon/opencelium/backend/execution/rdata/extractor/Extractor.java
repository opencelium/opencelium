package com.becon.opencelium.backend.execution.rdata.extractor;

import com.becon.opencelium.backend.invoker.entity.FunctionInvoker;
import com.becon.opencelium.backend.mysql.entity.RequestData;

import java.util.List;
import java.util.Optional;

public interface Extractor {

    Extractor setRequestData(List<RequestData> requestData);
    Extractor setFunctions(List<FunctionInvoker> functionInvokerList);
    Optional<String> getValue(String fieldName);
}
