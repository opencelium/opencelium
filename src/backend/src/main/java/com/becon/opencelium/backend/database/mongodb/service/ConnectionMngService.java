package com.becon.opencelium.backend.database.mongodb.service;

import com.becon.opencelium.backend.database.mongodb.entity.ConnectionMng;
import com.becon.opencelium.backend.database.mongodb.entity.FieldBindingMng;
import com.github.fge.jsonpatch.JsonPatch;

import java.util.List;

public interface ConnectionMngService {
    ConnectionMng save(ConnectionMng connectionMng);

    ConnectionMng getByConnectionId(Long connectionId);

    List<ConnectionMng> getAll();

    void delete(Long id);

    String updateMethod(Long connectionId, Integer connectorId, String methodId, JsonPatch patch);

    String updateOperator(Long connectionId, Integer connectorId, String operatorId, JsonPatch patch);

    FieldBindingMng updateFieldBinding(Long connectionId, JsonPatch patch, FieldBindingMng fieldBindingMng);

    ConnectionMng patchUpdate(Long connectionId, JsonPatch patch);
}
