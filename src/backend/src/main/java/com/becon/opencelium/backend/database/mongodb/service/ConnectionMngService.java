package com.becon.opencelium.backend.database.mongodb.service;

import com.becon.opencelium.backend.database.mongodb.entity.ConnectionMng;

import java.util.List;

public interface ConnectionMngService {
    ConnectionMng save(ConnectionMng connectionMng);

    ConnectionMng getByConnectionId(Long connectionId);

    List<ConnectionMng> getAll();

    void delete(Long id);
}
