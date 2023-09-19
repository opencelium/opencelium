package com.becon.opencelium.backend.database.mongodb.service;

import com.becon.opencelium.backend.database.mongodb.entity.ConditionMng;
import com.becon.opencelium.backend.resource.connection.ConditionDTO;


public interface ConditionMngService {
    ConditionMng toEntity(ConditionDTO conditionDTO);

    ConditionDTO toDTO(ConditionMng conditionMng);
}
