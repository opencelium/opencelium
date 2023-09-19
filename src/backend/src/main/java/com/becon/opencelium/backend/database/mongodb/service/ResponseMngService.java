package com.becon.opencelium.backend.database.mongodb.service;

import com.becon.opencelium.backend.database.mongodb.entity.ResponseMng;
import com.becon.opencelium.backend.resource.connector.ResponseResource;
import org.springframework.stereotype.Service;

public interface ResponseMngService {

    ResponseMng toEntity(ResponseResource responseDTO);

    ResponseResource toDTO(ResponseMng responseMng);
}
