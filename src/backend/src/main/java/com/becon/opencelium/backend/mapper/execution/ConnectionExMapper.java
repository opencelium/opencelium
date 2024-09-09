package com.becon.opencelium.backend.mapper.execution;

import com.becon.opencelium.backend.database.mongodb.entity.ConnectionMng;
import com.becon.opencelium.backend.resource.execution.ConnectionEx;
import org.springframework.stereotype.Component;

@Component
public class ConnectionExMapper {
    private final ConnectorExMapper connectorExMapper;
    private final FieldBindExMapper fieldBindExMapper;
    public ConnectionExMapper(ConnectorExMapper connectorExMapper, FieldBindExMapper fieldBindExMapper) {
        this.connectorExMapper = connectorExMapper;
        this.fieldBindExMapper = fieldBindExMapper;
    }

    public ConnectionEx toEntity(ConnectionMng dto){
        ConnectionEx connectionEx = new ConnectionEx();
        connectionEx.setConnectionId(dto.getConnectionId());
        connectionEx.setSource(connectorExMapper.toEntity(dto.getFromConnector(), dto.getConnectionId()));
        connectionEx.setTarget(connectorExMapper.toEntity(dto.getToConnector(), dto.getConnectionId()));
        connectionEx.setFieldBind(fieldBindExMapper.toEntityAll(dto.getFieldBindings()));
        return connectionEx;
    }
}
