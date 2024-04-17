package com.becon.opencelium.backend.execution.rdata;

import com.becon.opencelium.backend.constant.DataRef;
import com.becon.opencelium.backend.database.mysql.entity.Connector;
import com.becon.opencelium.backend.database.mysql.entity.RequestData;
import com.becon.opencelium.backend.execution.rdata.extractor.Extractor;
import com.becon.opencelium.backend.execution.rdata.extractor.ExtractorFactory;
import com.becon.opencelium.backend.invoker.entity.FunctionInvoker;

import java.util.List;
import java.util.Optional;

public class RequiredDataServiceImp implements RequiredDataService {

    private final List<RequestData> requestData;
    private final List<FunctionInvoker> functionInvokerList;

    public RequiredDataServiceImp(List<RequestData> requestData, List<FunctionInvoker> functionInvokerList) {
        this.requestData = requestData;
        this.functionInvokerList = functionInvokerList;
    }

    @Override
    public Optional<String> getValue(RequestData rqsd) {
        DataRef refType = getRefType(rqsd.getValue());
        if (refType == null) {
            return Optional.of(rqsd.getValue());
        }
        Extractor extractor = ExtractorFactory.getInstance(refType);
        return extractor
                .setRequestData(requestData)
                .setFunctions(functionInvokerList)
                .getValue(rqsd.getField());
    }

    private DataRef getRefType(String expression) {
        return DataRef.getType(expression);
    }
}
