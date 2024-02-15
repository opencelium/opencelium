package com.becon.opencelium.backend.database.mongodb.service;

import com.becon.opencelium.backend.database.mongodb.entity.ConnectionMng;
import com.becon.opencelium.backend.resource.PatchConnectionDetails;
import com.becon.opencelium.backend.resource.connection.ConnectionDTO;

import java.util.List;

public interface ConnectionMngService {
    ConnectionMng save(ConnectionMng connectionMng);
    ConnectionMng saveDirectly(ConnectionMng connectionMng);
    ConnectionMng getByConnectionId(Long connectionId);
    List<ConnectionMng> getAll();
    void delete(Long id);
    List<ConnectionMng> getAllById(List<Long> ids);
    long count();
    void doWithPatchedConnection(ConnectionDTO connectionDTO, ConnectionDTO patched, PatchConnectionDetails details);
}
