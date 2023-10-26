package com.becon.opencelium.backend.database.mongodb.service;

import com.becon.opencelium.backend.database.mongodb.entity.ResponseMng;
import com.becon.opencelium.backend.resource.connector.ResponseDTO;

public interface ResponseMngService {

    ResponseMng toEntity(ResponseDTO responseDTO);

    ResponseDTO toDTO(ResponseMng responseMng);
}
