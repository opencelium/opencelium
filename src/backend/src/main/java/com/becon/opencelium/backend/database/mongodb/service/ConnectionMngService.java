package com.becon.opencelium.backend.database.mongodb.service;

import com.becon.opencelium.backend.database.mongodb.entity.ConnectionMng;
import com.becon.opencelium.backend.database.mysql.entity.Connection;
import com.becon.opencelium.backend.resource.connection.ConnectionDTO;

import java.util.List;

public interface ConnectionMngService {
    ConnectionMng toEntity(ConnectionDTO dto);

    ConnectionMng save(ConnectionMng connectionMng);

    ConnectionDTO toDTO(ConnectionMng connectionMng);

    ConnectionMng getByConnectionId(Long connectionId);

    List<ConnectionMng> getAll();

    List<ConnectionDTO> toDTOAll(List<ConnectionMng> connectionMngs);

    Connection toEntity(ConnectionMng connectionMng);

}
