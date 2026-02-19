package com.becon.opencelium.backend.database.mongodb.service;

import com.becon.opencelium.backend.database.mongodb.entity.ConnectionMng;
import com.becon.opencelium.backend.resource.connection.ConnectionVersionUpdateRequest;

import java.util.List;

public interface ConnectionMngService {
    ConnectionMng save(ConnectionMng connectionMng);
    ConnectionMng create(ConnectionMng connectionMng);
    List<ConnectionMng> getAll();
    ConnectionMng delete(String id);
    void delete(ConnectionMng connectionMng);
    long count();
    ConnectionMng getById(String id);

    List<ConnectionMng> getAllByConnectionId(Long id);

    long deleteByConnectionIdIn(List<Long> chunk);

    void deleteAllByConnectionId(Long id);

    void updateSnapshot(ConnectionMng connectionMng, ConnectionVersionUpdateRequest request);
}
