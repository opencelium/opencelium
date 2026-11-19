package com.becon.opencelium.backend.mapper.execution;

import com.becon.opencelium.backend.database.mongodb.entity.ConnectionMng;
import com.becon.opencelium.backend.execution.globalvariable.GlobalVariableSnapshot;
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

    /**
     * Builds what a run executes from the stored workflow.
     *
     * @param globals the global variables of the run; a connector field that holds a reference
     *                gets its value from them
     */
    public ConnectionEx toEntity(ConnectionMng dto, GlobalVariableSnapshot globals) {
        ConnectionEx connectionEx = new ConnectionEx();

        connectionEx.setSource(connectorExMapper.toEntity(dto.getFromConnector(), globals));

        if (dto.getToConnector() != null) {
            connectionEx.setTarget(connectorExMapper.toEntity(dto.getToConnector(), globals));
        } else {
            connectionEx.setConnectors(connectorExMapper.toMethodConnectorMap(dto.getFromConnector(), globals));
        }

        connectionEx.setFieldBind(fieldBindExMapper.toEntityAll(dto.getFieldBindings()));
        return connectionEx;
    }
}
