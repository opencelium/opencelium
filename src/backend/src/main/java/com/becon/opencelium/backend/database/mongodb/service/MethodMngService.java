package com.becon.opencelium.backend.database.mongodb.service;

import com.becon.opencelium.backend.database.mongodb.entity.MethodMng;
import com.becon.opencelium.backend.resource.PatchConnectionDetails;
import com.becon.opencelium.backend.resource.connection.ConnectorDTO;

import java.util.List;

public interface MethodMngService {
    List<MethodMng> saveAll(List<MethodMng> methods);

    MethodMng save(MethodMng methodMng);

    void deleteById(String id);

    void delete(MethodMng methodMng);

    MethodMng getById(String id);

    void deleteAll(List<MethodMng> methods);
    String getNameByCode(String methodKey);

    void doWithPatchedMethod(ConnectorDTO connectorDTO, ConnectorDTO patched, PatchConnectionDetails.PatchOperationDetail opDetail);
}
