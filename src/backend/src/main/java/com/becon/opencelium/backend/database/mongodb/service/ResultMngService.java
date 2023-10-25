package com.becon.opencelium.backend.database.mongodb.service;

import com.becon.opencelium.backend.database.mongodb.entity.ResultMng;
import com.becon.opencelium.backend.resource.connector.ResultDTO;

public interface ResultMngService {

    ResultMng toEntity(ResultDTO resultDTO);

    ResultDTO toDTO(ResultMng resultMng);
}
