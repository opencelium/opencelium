package com.becon.opencelium.backend.database.mongodb.service;

import com.becon.opencelium.backend.database.mongodb.entity.*;
import com.becon.opencelium.backend.database.mysql.entity.Connector;
import com.becon.opencelium.backend.resource.connection.ConnectorDTO;
import org.springframework.beans.factory.annotation.Qualifier;
import org.springframework.stereotype.Service;

import java.util.List;

@Service
public class ConnectorMngServiceImp implements ConnectorMngService{
    private final MethodMngService methodMngService;
    private final OperatorMngService operatorMngService;

    public ConnectorMngServiceImp(
           @Qualifier("methodMngServiceImp") MethodMngService methodMngService,
           @Qualifier("operatorMngServiceImp") OperatorMngService operatorMngService) {
        this.methodMngService = methodMngService;
        this.operatorMngService = operatorMngService;
    }

    @Override
    public ConnectorMng toEntity(ConnectorDTO connectorDTO) {
        ConnectorMng connectorMng = new ConnectorMng();
        connectorMng.setConnectorId(connectorDTO.getConnectorId());
        connectorMng.setTitle(connectorDTO.getTitle());
        connectorMng.setTimeout(connectorDTO.getTimeout());
        connectorMng.setSslCert(connectorDTO.isSslCert());
        connectorMng.setIcon(connectorDTO.getIcon());
        connectorMng.setMethods(methodMngService.toEntityAll(connectorDTO.getMethods()));
        connectorMng.setOperators(operatorMngService.toEntityAll(connectorDTO.getOperators()));
        return connectorMng;
    }

    @Override
    public ConnectorDTO toDTO(ConnectorMng connectorMng) {
        ConnectorDTO connectorDTO = new ConnectorDTO();
        connectorDTO.setConnectorId(connectorMng.getConnectorId());
        connectorDTO.setNodeId(connectorMng.getId());
        connectorDTO.setIcon(connectorMng.getIcon());
        connectorDTO.setTimeout(connectorMng.getTimeout());
        connectorDTO.setTitle(connectorMng.getTitle());
        connectorDTO.setSslCert(connectorMng.isSslCert());
        connectorDTO.setMethods(methodMngService.toDTOAll(connectorMng.getMethods()));
        connectorDTO.setOperators(operatorMngService.toDTOAll(connectorMng.getOperators()));
        return connectorDTO;
    }

    @Override
    public ConnectorMng toEntity(Connector connector) {
        ConnectorMng connectorMng = new ConnectorMng();
        connectorMng.setConnectorId(connector.getId());
        connectorMng.setIcon(connector.getIcon());
        connectorMng.setTimeout(connector.getTimeout());
        connectorMng.setTitle(connector.getTitle());
        connectorMng.setSslCert(connector.isSslCert());
        return connectorMng;
    }
}
