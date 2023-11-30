package com.becon.opencelium.backend.database.mongodb.service;

import com.becon.opencelium.backend.database.mongodb.entity.ConnectionMng;
import com.becon.opencelium.backend.database.mongodb.entity.FieldBindingMng;

import java.util.List;
import java.util.Optional;

public interface FieldBindingMngService {
    void bind(ConnectionMng connectionMng);

    List<FieldBindingMng> saveAll(List<FieldBindingMng> fieldBindings);

    FieldBindingMng save(FieldBindingMng fieldBindingMng);

    Optional<FieldBindingMng> findById(String fieldBindingId);
    List<FieldBindingMng> findAllByEnhancementId(List<Integer> ids);

    void deleteById(String id);
}
