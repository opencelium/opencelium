package com.becon.opencelium.backend.database.mongodb.service;

import com.becon.opencelium.backend.database.mongodb.entity.ConnectionMng;
import com.becon.opencelium.backend.database.mongodb.entity.ConnectorMng;
import com.becon.opencelium.backend.database.mongodb.entity.DataAggregatorMng;
import com.becon.opencelium.backend.database.mongodb.entity.FieldBindingMng;
import com.becon.opencelium.backend.database.mongodb.repository.ConnectionMngRepository;
import com.becon.opencelium.backend.database.mysql.entity.Connection;
import com.becon.opencelium.backend.exception.ConnectionNotFoundException;
import com.becon.opencelium.backend.resource.connection.ConnectionDTO;
import org.springframework.beans.factory.annotation.Qualifier;
import org.springframework.stereotype.Service;

import java.util.ArrayList;
import java.util.List;

@Service
public class ConnectionMngServiceImp implements ConnectionMngService{
    private final ConnectionMngRepository connectionMngRepository;
    private final ConnectorMngService connectorMngService;
    private final FieldBindingMngService fieldBindingMngService;
    private final DataAggregatorMngService dataAggregatorMngService;

    public ConnectionMngServiceImp(
            ConnectionMngRepository connectionMngRepository,
            @Qualifier("connectorMngServiceImp") ConnectorMngService connectorMngService,
            @Qualifier("fieldBindingMngServiceImp") FieldBindingMngService fieldBindingMngService,
            @Qualifier("dataAggregatorMngServiceImp") DataAggregatorMngService dataAggregatorMngService
    ) {
        this.connectionMngRepository = connectionMngRepository;
        this.connectorMngService = connectorMngService;
        this.fieldBindingMngService = fieldBindingMngService;
        this.dataAggregatorMngService = dataAggregatorMngService;
    }

    @Override
    public ConnectionMng save(ConnectionMng connectionMng) {
        return connectionMngRepository.save(connectionMng);
    }

    @Override
    public ConnectionMng getByConnectionId(Long connectionId) {
        return connectionMngRepository.findByConnectionId(connectionId)
                .orElseThrow(()-> new ConnectionNotFoundException(connectionId));
    }

    @Override
    public List<ConnectionMng> getAll() {
        return connectionMngRepository.findAll();
    }

    @Override
    public ConnectionDTO toDTO(ConnectionMng connectionMng) {
        ConnectionDTO connectionDTO = new ConnectionDTO();
        connectionDTO.setConnectionId(connectionMng.getConnectionId());
        connectionDTO.setNodeId(connectionMng.getId());
        connectionDTO.setTitle(connectionMng.getTitle());
        connectionDTO.setDescription(connectionMng.getDescription());
        connectionDTO.setToConnector(connectorMngService.toDTO(connectionMng.getToConnector()));
        connectionDTO.setFromConnector(connectorMngService.toDTO(connectionMng.getFromConnector()));
        connectionDTO.setDataAggregator(dataAggregatorMngService.toDTO(connectionMng.getDataAggregator()));
        connectionDTO.setFieldBinding(fieldBindingMngService.toDTOAll(connectionMng.getFieldBinding()));
        return connectionDTO;
    }

    @Override
    public List<ConnectionDTO> toDTOAll(List<ConnectionMng> connectionMngs) {
        ArrayList<ConnectionDTO> connectionDTOS = new ArrayList<>();
        for (ConnectionMng connectionMng : connectionMngs) {
            connectionDTOS.add(toDTO(connectionMng));
        }
        return connectionDTOS;
    }

    @Override
    public Connection toEntity(ConnectionMng connectionMng) {
        Connection connection = new Connection();
        connection.setId(connectionMng.getConnectionId());
        connection.setName(connectionMng.getTitle());
        connection.setDescription(connectionMng.getDescription());
        connection.setFromConnector(connectionMng.getFromConnector().getConnectorId());
        connection.setToConnector(connectionMng.getToConnector().getConnectorId());
        return connection;
    }

    @Override
    public ConnectionMng toEntity(ConnectionDTO dto){
        ConnectionMng connectionMng = new ConnectionMng();
        connectionMng.setConnectionId(dto.getConnectionId());
        connectionMng.setId(dto.getNodeId());
        connectionMng.setTitle(dto.getTitle());
        connectionMng.setDescription(dto.getDescription());
        connectionMng.setToConnector(connectorMngService.toEntity(dto.getToConnector()));
        connectionMng.setFromConnector(connectorMngService.toEntity(dto.getFromConnector()));
        connectionMng.setFieldBinding(fieldBindingMngService.toEntityAll(dto.getFieldBinding()));
        connectionMng.setDataAggregator(dataAggregatorMngService.toEntity(dto.getDataAggregator()));
        return connectionMng;
    }
}
