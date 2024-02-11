package com.becon.opencelium.backend.gc.connection.service;

import com.becon.opencelium.backend.database.mongodb.entity.ConnectionMng;
import com.becon.opencelium.backend.database.mongodb.service.ConnectionMngService;
import com.becon.opencelium.backend.database.mysql.entity.Connection;
import com.becon.opencelium.backend.database.mysql.service.ConnectionService;
import com.becon.opencelium.backend.gc.connection.ConnectionForGC;
import org.springframework.beans.factory.annotation.Qualifier;
import org.springframework.stereotype.Service;

import java.util.List;
import java.util.Objects;
import java.util.stream.Collectors;

@Service
public class ConnectionGCService {
    private final ConnectionService connectionService;
    private final ConnectionMngService connectionMngService;

    public ConnectionGCService(
            @Qualifier("connectionServiceImp") ConnectionService connectionService,
            @Qualifier("connectionMngServiceImp") ConnectionMngService connectionMngService
    ) {
        this.connectionService = connectionService;
        this.connectionMngService = connectionMngService;
    }

    public List<ConnectionForGC> getAllConnections() {
        List<Connection> connections = connectionService.findAll();
        List<ConnectionMng> connectionMngs = connectionMngService.getAll();

        return connections.stream().map(c -> {
            for (ConnectionMng connectionMng : connectionMngs) {
                if (Objects.equals(connectionMng.getConnectionId(), c.getId()))
                    return new ConnectionForGC(c, connectionMng);
            }
            throw new RuntimeException("CONNECTION_NOT_FOUND");
        }).collect(Collectors.toList());
    }

    public void deleteAll(List<Long> connectionIds) {
        for (Long connectionId : connectionIds) {
            connectionService.deleteById(connectionId);
        }
    }

    public List<ConnectionForGC> getAllConnectionsNotContains(List<Long> allConnectionIds) {
        List<Connection> connections = connectionService.getAllConnectionsNotContains(allConnectionIds);
        if(connections.isEmpty()){
            return null;
        }
        List<ConnectionMng> connectionMngs = connectionMngService.getAllById(connections.stream().map(Connection::getId).toList());

        return connections.stream().map(c -> {
            for (ConnectionMng connectionMng : connectionMngs) {
                if (Objects.equals(connectionMng.getConnectionId(), c.getId()))
                    return new ConnectionForGC(c, connectionMng);
            }
            throw new RuntimeException("CONNECTION_NOT_FOUND");
        }).collect(Collectors.toList());
    }

    public boolean exists(Long id) {
        return connectionService.existsById(id);
    }

    public void deleteById(Long id) {
        connectionService.deleteById(id);
    }

    public ConnectionForGC getById(Long id) {
        Connection connection = connectionService.getById(id);
        ConnectionMng connectionMng = connectionMngService.getByConnectionId(id);
        return new ConnectionForGC(connection, connectionMng);
    }
}
