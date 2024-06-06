package com.becon.opencelium.backend.gc.connection.service;

import com.becon.opencelium.backend.database.mongodb.entity.ConnectionMng;
import com.becon.opencelium.backend.database.mongodb.service.ConnectionMngService;
import com.becon.opencelium.backend.database.mysql.entity.Connection;
import com.becon.opencelium.backend.database.mysql.service.ConnectionService;
import com.becon.opencelium.backend.exception.ConnectionNotFoundException;
import com.becon.opencelium.backend.gc.connection.ConnectionForGC;
import org.springframework.beans.factory.annotation.Qualifier;
import org.springframework.stereotype.Service;

import java.util.ArrayList;
import java.util.List;
import java.util.Objects;

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

        List<ConnectionForGC> list = merge(connections);

        long count = connectionMngService.count();
        if (count != list.size()) {
            List<ConnectionMng> connectionMngs = connectionMngService.getAll();
            for (ConnectionMng connectionMng : connectionMngs) {
                list.stream()
                        .filter(c -> Objects.equals(c.getConnection().getId(), connectionMng.getConnectionId()))
                        .findAny()
                        .ifPresentOrElse(c -> {
                        }, () -> {
                            connectionMngService.delete(connectionMng.getConnectionId());
                        });
            }
        }
        return list;
    }

    public void deleteAll(List<Long> connectionIds) {
        for (Long connectionId : connectionIds) {
            connectionService.deleteById(connectionId);
        }
    }

    public List<ConnectionForGC> getAllConnectionsNotContains(List<Long> allConnectionIds) {
        List<Connection> connections = connectionService.getAllConnectionsNotContains(allConnectionIds);
        if (connections.isEmpty()) {
            if (connectionMngService.count() != 0) {
                connectionMngService.getAll().forEach(c -> {
                    if (!allConnectionIds.contains(c.getConnectionId())) {
                        connectionMngService.delete(c.getConnectionId());
                    }
                });
            }
            return null;
        }
        return merge(connections);
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

    private List<ConnectionForGC> merge(List<Connection> connections) {
        List<ConnectionForGC> list = new ArrayList<>();
        if (connections == null) {
            return list;
        }
        connections.forEach(c -> {
            try {
                ConnectionMng connectionMng = connectionMngService.getByConnectionId(c.getId());
                list.add(new ConnectionForGC(c, connectionMng));
            } catch (ConnectionNotFoundException e) {
                connectionService.deleteOnlyConnection(c.getId());
            }
        });
        return list;
    }
}
