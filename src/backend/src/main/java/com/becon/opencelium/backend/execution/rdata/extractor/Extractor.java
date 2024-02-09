package com.becon.opencelium.backend.execution.rdata.extractor;

import com.becon.opencelium.backend.database.mysql.entity.RequestData;
import com.becon.opencelium.backend.invoker.entity.FunctionInvoker;

import java.util.List;
import java.util.Optional;

public interface Extractor {

    Extractor setRequestData(List<RequestData> requestData);
    Extractor setFunctions(List<FunctionInvoker> functionInvokerList);
    Optional<String> getValue(String fieldName);

    default Extractor disableSslValidation(boolean isDisabled) {
        return this;
    }
}
