package com.becon.opencelium.backend.database.mongodb.service;

import com.becon.opencelium.backend.database.mongodb.entity.ExecutionPlanMng;
import com.becon.opencelium.backend.database.mongodb.entity.MapperMng;
import com.becon.opencelium.backend.resource.connection.v5.ExecutionPlanDTO;

public interface ExecutionPlanService {
    ExecutionPlanMng initNew();
    ExecutionPlanMng initNew(String mode);

    ExecutionPlanMng reorderSteps(Long connectionId, MapperMng mapper, boolean save);

    ExecutionPlanDTO getByConnectionId(Long connectionId);
}
