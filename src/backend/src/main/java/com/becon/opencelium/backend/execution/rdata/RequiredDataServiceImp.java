package com.becon.opencelium.backend.execution.rdata;

import com.becon.opencelium.backend.constant.DataRef;
import com.becon.opencelium.backend.execution.rdata.extractor.Extractor;
import com.becon.opencelium.backend.execution.rdata.extractor.ExtractorFactory;
import com.becon.opencelium.backend.invoker.entity.FunctionInvoker;
import com.becon.opencelium.backend.mysql.entity.Connector;
import com.becon.opencelium.backend.mysql.entity.RequestData;

import java.util.List;
import java.util.Optional;

public class RequiredDataServiceImp implements RequiredDataService {

    private final List<RequestData> requestData;
    private final List<FunctionInvoker> functionInvokerList;
    private Connector connector;

    public RequiredDataServiceImp(Connector connector, List<FunctionInvoker> functionInvokerList) {
        this.requestData = connector.getRequestData();
        this.functionInvokerList = functionInvokerList;
        this.connector = connector;
    }

    @Override
    public Optional<String> getValue(RequestData rqsd) {
        DataRef refType = getRefType(rqsd.getValue());
        if (refType == null) {
            return Optional.of(rqsd.getValue());
        }
        Extractor extractor = ExtractorFactory.getInstance(refType);
        return extractor.setRequestData(requestData)
                .setFunctions(functionInvokerList)
                .disableSslValidation(connector.isSslValidation())
                .getValue(rqsd.getField());
    }

    private DataRef getRefType(String expression) {
        return DataRef.getType(expression);
    }
}
