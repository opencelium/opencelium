package com.becon.opencelium.backend.database.mongodb.service;

import com.becon.opencelium.backend.database.mongodb.entity.ConnectionMng;
import com.becon.opencelium.backend.database.mongodb.entity.FieldBindingMng;
import com.becon.opencelium.backend.database.mongodb.entity.MethodMng;
import com.becon.opencelium.backend.resource.PatchConnectionDetails;
import com.becon.opencelium.backend.resource.connection.ConnectionDTO;

import java.util.List;
import java.util.Optional;

public interface FieldBindingMngService {
    void bind(ConnectionMng connectionMng);

    void bind(List<FieldBindingMng> fieldBindings, List<MethodMng> methods);

    void detach(ConnectionDTO connectionDTO);

    void detach(List<MethodMng> methods, List<FieldBindingMng> fbs);

    List<FieldBindingMng> saveAll(List<FieldBindingMng> fieldBindings);

    FieldBindingMng save(FieldBindingMng fieldBindingMng);

    Optional<FieldBindingMng> findById(String fieldBindingId);

    FieldBindingMng getById(String id);

    List<FieldBindingMng> findAllByEnhancementId(List<Integer> ids);

    void deleteById(String id);

    void delete(FieldBindingMng fb);

    void deleteAll(List<FieldBindingMng> fieldBindings);

    void doWithPatchedEnhancement(ConnectionDTO connectionDTO, ConnectionDTO patched, PatchConnectionDetails.PatchOperationDetail details);
}
