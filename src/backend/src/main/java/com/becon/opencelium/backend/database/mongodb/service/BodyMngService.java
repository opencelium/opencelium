package com.becon.opencelium.backend.database.mongodb.service;

import com.becon.opencelium.backend.database.mongodb.entity.BodyMng;
import com.becon.opencelium.backend.resource.connector.BodyResource;


public interface BodyMngService {
    BodyMng toEntity(BodyResource bodyDTO);
    BodyResource toDTO(BodyMng bodyMng);
}
