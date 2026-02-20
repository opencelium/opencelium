package com.becon.opencelium.backend.database.mongodb.service;

import com.becon.opencelium.backend.database.mongodb.entity.ConnectionMng;
import com.becon.opencelium.backend.resource.connection.ConnectionDTO;

public interface FieldBindingMngService {
    void bind(ConnectionMng connectionMng);

    void detach(ConnectionDTO connectionDTO);

    void deleteAll();
}
