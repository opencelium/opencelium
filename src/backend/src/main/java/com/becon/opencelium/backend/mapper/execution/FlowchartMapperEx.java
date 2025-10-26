package com.becon.opencelium.backend.mapper.execution;

import com.becon.opencelium.backend.database.mongodb.entity.FlowchartMng;
import com.becon.opencelium.backend.database.mysql.entity.Connector;
import com.becon.opencelium.backend.database.mysql.entity.RequestData;
import com.becon.opencelium.backend.database.mysql.service.ConnectorService;
import com.becon.opencelium.backend.enums.OpType;
import com.becon.opencelium.backend.execution.rdata.RequiredDataService;
import com.becon.opencelium.backend.execution.rdata.RequiredDataServiceImp;
import com.becon.opencelium.backend.invoker.entity.Invoker;
import com.becon.opencelium.backend.invoker.service.InvokerService;
import com.becon.opencelium.backend.resource.execution.FlowchartEx;
import com.becon.opencelium.backend.resource.execution.InvokerEx;
import com.becon.opencelium.backend.resource.execution.OperationDTO;
import org.springframework.beans.factory.annotation.Qualifier;
import org.springframework.stereotype.Component;
import org.springframework.util.CollectionUtils;

import java.util.Collections;
import java.util.HashMap;
import java.util.List;
import java.util.Map;

@Component
public class FlowchartMapperEx {

    private final ConnectorService connectorService;
    private final OperationExMapper operationExMapper;
    private final OperatorExMapper operatorExMapper;
    private final InvokerService invokerService;

    public FlowchartMapperEx(
            @Qualifier("connectorServiceImp") ConnectorService connectorService,
            @Qualifier("invokerServiceImp") InvokerService invokerService,
            OperationExMapper operationExMapper,
            OperatorExMapper operatorExMapper
    ) {
        this.connectorService = connectorService;
        this.operationExMapper = operationExMapper;
        this.operatorExMapper = operatorExMapper;
        this.invokerService = invokerService;
    }


    public List<FlowchartEx> toFlowchartExAll(List<FlowchartMng> flowcharts, Long connectionId) {
        if (CollectionUtils.isEmpty(flowcharts)) {
            return Collections.emptyList();
        }

        return flowcharts.stream()
                .map(x->toFlowchartEx(x, connectionId))
                .toList();
    }

    private FlowchartEx toFlowchartEx(FlowchartMng flowchart, Long connectionId) {
        if(flowchart == null) {
            return null;
        }

        FlowchartEx flowchartEx = new FlowchartEx();

        Connector connector = connectorService.getById(flowchart.getConnectorId());

        List<RequestData> requestData = connector.getRequestData();

        Invoker invoker = invokerService.findByName(connector.getInvoker());
        invoker.getRequiredData().forEach(rd -> {
            if (requestData.stream().noneMatch(rqsd -> rqsd.getField().equals(rd.getName()))) {
                requestData.add(new RequestData(rd));
            }
        });

        RequiredDataService requiredDataService = new RequiredDataServiceImp(connector,requestData, invoker.getOperations());
        requestData.forEach(rqsd -> {
            String value = requiredDataService.getValue(rqsd).orElse(null);
            rqsd.setValue(value);
        });

        Map<String, String> map = new HashMap<>();
        requestData.forEach(r -> map.put(r.getField(), r.getValue()));

        flowchartEx.setName(connector.getTitle());
        flowchartEx.setSslCert(connector.isSslValidation());
        flowchartEx.setInvoker(new InvokerEx(connector.getInvoker()));
        flowchartEx.setRequiredData(map);

        flowchartEx.setCtorId(flowchart.getConnectorId());
        flowchartEx.setFlowId(flowchart.getFlowId());
        flowchartEx.setMethods(operationExMapper.toOperationAll(flowchart.getMethods(), connectionId, connector.getInvoker()));
        flowchartEx.setOperators(operatorExMapper.toEntityAll(flowchart.getOperators()));

        setPagination(flowchartEx, invoker);
        return flowchartEx;
    }

    private void setPagination(FlowchartEx flowchartEx, Invoker invoker) {
        flowchartEx.setPagination(invoker.getPagination());

        List<OperationDTO> operations = flowchartEx.getMethods();

        for (OperationDTO operation : operations) {
            invoker.getOperations().stream()
                    .filter(f -> f.getName().equals(operation.getName()))
                    .findAny()
                    .ifPresentOrElse(ff -> {
                        if (ff.getType().equals("page")) {
                            if (ff.getPagination() == null) {
                                operation.setPagination(invoker.getPagination());
                            } else {
                                operation.setPagination(ff.getPagination());
                            }
                            operation.setOperationType(OpType.PAGINATION);
                        } else {
                            operation.setOperationType(OpType.fromValue(ff.getType()));
                        }
                    }, () -> {
                        throw new RuntimeException("Method not found with name: " + operation.getName());
                    });
        }
    }
}
