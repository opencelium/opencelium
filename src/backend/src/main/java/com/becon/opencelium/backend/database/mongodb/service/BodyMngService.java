package com.becon.opencelium.backend.database.mongodb.service;

import com.becon.opencelium.backend.database.mongodb.entity.BodyMng;
import com.becon.opencelium.backend.resource.connector.BodyDTO;


public interface BodyMngService {
    BodyMng toEntity(BodyDTO bodyDTO);
    BodyDTO toDTO(BodyMng bodyMng);
}
