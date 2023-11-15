package com.becon.opencelium.backend.database.mongodb.service;

import com.becon.opencelium.backend.database.mongodb.entity.ConnectionMng;
import com.becon.opencelium.backend.database.mongodb.entity.FieldBindingMng;

import java.util.List;

public interface FieldBindingMngService {
    void bind(ConnectionMng connectionMng);

    List<FieldBindingMng> saveAll(List<FieldBindingMng> fieldBindings);
}
