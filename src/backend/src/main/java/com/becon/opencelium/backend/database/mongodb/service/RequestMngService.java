package com.becon.opencelium.backend.database.mongodb.service;

import com.becon.opencelium.backend.database.mongodb.entity.RequestMng;
import com.becon.opencelium.backend.resource.connector.RequestDTO;

public interface RequestMngService {

    RequestMng toEntity(RequestDTO requestDTO);

    RequestDTO toDTO(RequestMng requestMng);
}
