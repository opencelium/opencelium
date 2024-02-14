package com.becon.opencelium.backend.database.mongodb.service;

import com.becon.opencelium.backend.database.mongodb.entity.OperatorMng;
import com.becon.opencelium.backend.resource.PatchConnectionDetails;
import com.becon.opencelium.backend.resource.connection.ConnectorDTO;

import java.util.List;

public interface OperatorMngService {
    List<OperatorMng> saveAll(List<OperatorMng> operators);

    OperatorMng save(OperatorMng operatorMng);

    void deleteById(String id);

    void delete(OperatorMng operatorMng);

    OperatorMng getById(String id);

    void deleteAll(List<OperatorMng> operators);

    void doWithPatchedOperator(ConnectorDTO connectorDTO, ConnectorDTO patched, PatchConnectionDetails.PatchOperationDetail opDetail);
}