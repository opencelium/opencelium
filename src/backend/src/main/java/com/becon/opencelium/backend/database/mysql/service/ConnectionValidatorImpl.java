package com.becon.opencelium.backend.database.mysql.service;

import com.becon.opencelium.backend.database.mongodb.entity.ConnectionMng;
import com.becon.opencelium.backend.database.mongodb.service.ConnectionMngService;
import com.becon.opencelium.backend.database.mysql.entity.Connection;
import com.becon.opencelium.backend.exception.ConnectionValidationException;
import org.springframework.context.annotation.Lazy;
import org.springframework.stereotype.Component;

import java.util.Objects;

@Component
public class ConnectionValidatorImpl implements ConnectionValidator {

    private final ConnectionService connectionService;
    private final ConnectionMngService connectionMngService;

    public ConnectionValidatorImpl(@Lazy ConnectionService connectionService, @Lazy ConnectionMngService connectionMngService) {
        this.connectionService = connectionService;
        this.connectionMngService = connectionMngService;
    }

    @Override
    public void validateCreate(Connection connection, ConnectionMng connectionMng) {
        if (connectionService.existsByName(connection.getTitle())) {
            throw ConnectionValidationException.titleAlreadyTaken(connection.getTitle());
        }

        if (Objects.isNull(connectionMng))
            throw ConnectionValidationException.connectionNotFound(null);

        if (connectionMng.getConnectionId() != null && connectionMngService.existsByConnectionId(connectionMng.getConnectionId())) {
            throw ConnectionValidationException.connectionAlreadyExists(connectionMng.getConnectionId());
        }
    }

    @Override
    public void validateUpdate(Connection currCon, Connection newConnection, ConnectionMng newConnectionMng) {
        if (!Objects.equals(currCon.getTitle(), newConnection.getTitle())) {
            if (connectionService.existsByName(newConnection.getTitle())) {
                throw ConnectionValidationException.titleAlreadyTaken(newConnection.getTitle());
            }
        }
    }
}
