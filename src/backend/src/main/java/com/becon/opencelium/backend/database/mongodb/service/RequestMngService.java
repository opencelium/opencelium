package com.becon.opencelium.backend.database.mongodb.service;

import com.becon.opencelium.backend.database.mongodb.entity.RequestMng;
import com.becon.opencelium.backend.resource.connector.RequestResource;
import org.springframework.stereotype.Service;

public interface RequestMngService {

    RequestMng toEntity(RequestResource requestDTO);

    RequestResource toDTO(RequestMng requestMng);
}
