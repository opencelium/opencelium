package com.becon.opencelium.backend.mapper.execution;

import com.becon.opencelium.backend.database.mongodb.entity.ConnectorMng;
import com.becon.opencelium.backend.database.mysql.entity.Connector;
import com.becon.opencelium.backend.database.mysql.entity.RequestData;
import com.becon.opencelium.backend.database.mysql.service.ConnectorService;
import com.becon.opencelium.backend.enums.OpType;
import com.becon.opencelium.backend.execution.rdata.RequiredDataService;
import com.becon.opencelium.backend.execution.rdata.RequiredDataServiceImp;
import com.becon.opencelium.backend.invoker.entity.Invoker;
import com.becon.opencelium.backend.invoker.service.InvokerService;
import com.becon.opencelium.backend.resource.execution.ConnectorEx;
import com.becon.opencelium.backend.resource.execution.OperationDTO;
import org.springframework.beans.factory.annotation.Qualifier;
import org.springframework.stereotype.Component;

import java.util.HashMap;
import java.util.List;
import java.util.Map;

@Component
public class ConnectorExMapper {
    private final ConnectorService connectorService;
    private final OperationExMapper operationExMapper;
    private final OperatorExMapper operatorExMapper;
    private final InvokerService invokerService;

    public ConnectorExMapper(@Qualifier("connectorServiceImp") ConnectorService connectorService,
                             OperationExMapper operationExMapper,
                             OperatorExMapper operatorExMapper,
                             @Qualifier("invokerServiceImp") InvokerService invokerService) {
        this.connectorService = connectorService;
        this.operationExMapper = operationExMapper;
        this.operatorExMapper = operatorExMapper;
        this.invokerService = invokerService;
    }

    ConnectorEx toEntity(ConnectorMng dto, Long connectionId) {
        Connector connector = connectorService.getById(dto.getConnectorId());
        ConnectorEx connectorEx = new ConnectorEx();

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

        connectorEx.setName(connector.getTitle());
        connectorEx.setSslCert(connector.isSslValidation());
        connectorEx.setInvoker(connector.getInvoker());
        connectorEx.setRequiredData(map);

        connectorEx.setId(dto.getConnectorId());
        connectorEx.setMethods(operationExMapper.toOperationAll(dto.getMethods(), connectionId, connector.getInvoker()));
        connectorEx.setOperators(operatorExMapper.toEntityAll(dto.getOperators()));

        setPagination(connectorEx, invoker);
        return connectorEx;
    }

    private void setPagination(ConnectorEx connectorEx, Invoker invoker) {
        connectorEx.setPagination(invoker.getPagination());

        List<OperationDTO> operations = connectorEx.getMethods();

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
