package com.becon.opencelium.backend.database.mongodb.service;

import com.becon.opencelium.backend.database.mongodb.entity.ConnectionMng;

import java.util.List;

public interface ConnectionMngService {
    boolean existsByConnectionId(Long id);
    ConnectionMng save(ConnectionMng connectionMng);
    ConnectionMng create(ConnectionMng connectionMng);
    void updateAndBind(ConnectionMng old, ConnectionMng connectionMng);
    ConnectionMng saveDirectly(ConnectionMng connectionMng);
    ConnectionMng getByConnectionId(Long connectionId);
    List<ConnectionMng> getAll();
    ConnectionMng delete(Long id);

    void updateWithoutBinding(ConnectionMng connectionMng);

    List<ConnectionMng> getAllById(List<Long> ids);
    long count();
}
