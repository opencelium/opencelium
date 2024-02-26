package com.becon.opencelium.backend.mapper.execution;

import com.becon.opencelium.backend.database.mongodb.entity.ConnectorMng;
import com.becon.opencelium.backend.database.mysql.entity.Connector;
import com.becon.opencelium.backend.database.mysql.entity.RequestData;
import com.becon.opencelium.backend.database.mysql.service.ConnectorService;
import com.becon.opencelium.backend.resource.execution.ConnectorEx;
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

    public ConnectorExMapper(@Qualifier("connectorServiceImp") ConnectorService connectorService, OperationExMapper operationExMapper, OperatorExMapper operatorExMapper) {
        this.connectorService = connectorService;
        this.operationExMapper = operationExMapper;
        this.operatorExMapper = operatorExMapper;
    }

    ConnectorEx toEntity(ConnectorMng dto, Long connectionId) {
        Connector connector = connectorService.getById(dto.getConnectorId());
        ConnectorEx connectorEx = new ConnectorEx();

        List<RequestData> requestData = connector.getRequestData();
        Map<String, String> map = new HashMap<>();
        requestData.forEach(r -> map.put(r.getField(), r.getValue()));

        connectorEx.setSslCert(connector.isSslCert());
        connectorEx.setInvoker(connector.getInvoker());
        connectorEx.setRequiredData(map);

        connectorEx.setId(dto.getConnectorId());
        connectorEx.setMethods(operationExMapper.toOperationAll(dto.getMethods(), connectionId));
        connectorEx.setOperators(operatorExMapper.toEntityAll(dto.getOperators()));
        return connectorEx;
    }
}
