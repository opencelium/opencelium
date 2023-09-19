package com.becon.opencelium.backend.database.mongodb.service;

import com.becon.opencelium.backend.database.mongodb.entity.ResultMng;
import com.becon.opencelium.backend.resource.connector.ResultResource;
import org.springframework.stereotype.Service;

public interface ResultMngService {

    ResultMng toEntity(ResultResource resultDTO);

    ResultResource toDTO(ResultMng resultMng);
}
