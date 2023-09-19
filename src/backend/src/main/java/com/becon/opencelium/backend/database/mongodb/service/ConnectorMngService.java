package com.becon.opencelium.backend.database.mongodb.service;

import com.becon.opencelium.backend.database.mongodb.entity.ConnectorMng;
import com.becon.opencelium.backend.database.mysql.entity.Connector;
import com.becon.opencelium.backend.resource.connection.ConnectorDTO;

public interface ConnectorMngService {
    ConnectorMng toEntity(ConnectorDTO connectorNodeDTO);

    ConnectorDTO toDTO(ConnectorMng connectionMng);

    ConnectorMng toEntity(Connector connector);
}
