package com.becon.opencelium.backend.mapper.execution;

import com.becon.opencelium.backend.constant.ConnectionConstants;
import com.becon.opencelium.backend.database.mongodb.entity.ConnectorMng;
import com.becon.opencelium.backend.database.mongodb.entity.MethodConnectorMng;
import com.becon.opencelium.backend.database.mongodb.entity.MethodMng;
import com.becon.opencelium.backend.database.mysql.entity.Connector;
import com.becon.opencelium.backend.database.mysql.entity.RequestData;
import com.becon.opencelium.backend.database.mysql.service.ConnectorService;
import com.becon.opencelium.backend.enums.OpType;
import com.becon.opencelium.backend.execution.rdata.RequiredDataService;
import com.becon.opencelium.backend.execution.rdata.RequiredDataServiceImp;
import com.becon.opencelium.backend.invoker.entity.Invoker;
import com.becon.opencelium.backend.invoker.service.InvokerService;
import com.becon.opencelium.backend.resource.execution.ConnectorEx;
import com.becon.opencelium.backend.resource.execution.MethodConnectorEx;
import com.becon.opencelium.backend.resource.execution.OperationDTO;
import org.springframework.beans.factory.annotation.Qualifier;
import org.springframework.stereotype.Component;

import java.util.*;
import java.util.stream.Collectors;

@Component
public class ConnectorExMapper {
    private final ConnectorService connectorService;
    private final OperationExMapper operationExMapper;
    private final OperatorExMapper operatorExMapper;
    private final InvokerService invokerService;

    public ConnectorExMapper(
            @Qualifier("connectorServiceImp") ConnectorService connectorService,
            OperationExMapper operationExMapper,
            OperatorExMapper operatorExMapper,
            @Qualifier("invokerServiceImp") InvokerService invokerService
    ) {
        this.connectorService = connectorService;
        this.operationExMapper = operationExMapper;
        this.operatorExMapper = operatorExMapper;
        this.invokerService = invokerService;
    }

    ConnectorEx toEntity(ConnectorMng dto) {
        if (dto == null) return null;
        ConnectorEx connectorEx = new ConnectorEx();
        if(!Objects.equals(ConnectionConstants.DEFAULT_CONNECTOR_ID, dto.getConnectorId())){
            Connector connector = connectorService.getById(dto.getConnectorId());
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

            connectorEx.setSslCert(connector.isTrustCertificate());
            connectorEx.setInvoker(connector.getInvoker());
            connectorEx.setRequiredData(map);

            connectorEx.setMethods(operationExMapper.toOperationAll(dto.getMethods(), connector.getInvoker()));
            setPagination(connectorEx, invoker);
        } else {
            connectorEx.setMethods(operationExMapper.toOperationAll(dto.getMethods(), null));
            connectorEx.setInvoker(ConnectionConstants.DEFAULT_INVOKER_NAME);
        }

        connectorEx.setName(dto.getTitle());
        connectorEx.setId(dto.getConnectorId());
        connectorEx.setFchartId(dto.getFlowId());
        connectorEx.setOperators(operatorExMapper.toEntityAll(dto.getOperators()));

        return connectorEx;
    }

    // Builds the connectors map for multi-connector connections. Collects unique connectorIds
    // from methods that carry their own connector reference, loads each once, and returns a map
    // keyed by connector ID for fast lookup during execution.
    Map<Integer, MethodConnectorEx> toMethodConnectorMap(ConnectorMng fromConnector) {
        if (fromConnector == null || fromConnector.getMethods() == null) {
            return Map.of();
        }
        Map<Integer, MethodConnectorEx> result = new HashMap<>();
        fromConnector.getMethods().stream()
                .filter(m -> m.getConnector() != null && m.getConnector().getConnectorId() != null)
                .map(MethodMng::getConnector)
                .collect(Collectors.toMap(
                        MethodConnectorMng::getConnectorId,
                        MethodConnectorMng::getConnectorId,
                        (a, b) -> a))
                .keySet()
                .forEach(connectorId -> {
                    Connector connector = connectorService.getById(connectorId);
                    Invoker invoker = invokerService.findByName(connector.getInvoker());

                    List<RequestData> requestData = connector.getRequestData();
                    invoker.getRequiredData().forEach(rd -> {
                        if (requestData.stream().noneMatch(rqsd -> rqsd.getField().equals(rd.getName()))) {
                            requestData.add(new RequestData(rd));
                        }
                    });
                    RequiredDataService requiredDataService = new RequiredDataServiceImp(connector, requestData, invoker.getOperations());
                    requestData.forEach(rqsd -> rqsd.setValue(requiredDataService.getValue(rqsd).orElse(null)));

                    Map<String, String> requiredDataMap = new HashMap<>();
                    requestData.forEach(r -> requiredDataMap.put(r.getField(), r.getValue()));

                    MethodConnectorEx mcEx = new MethodConnectorEx();
                    mcEx.setId(connector.getId());
                    mcEx.setTitle(connector.getTitle());
                    mcEx.setSslCert(connector.isTrustCertificate());
                    mcEx.setTimeout(connector.getTimeout());
                    mcEx.setInvoker(connector.getInvoker());
                    mcEx.setRequiredData(requiredDataMap);
                    mcEx.setPagination(invoker.getPagination());
                    result.put(connectorId, mcEx);
                });
        return result;
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
