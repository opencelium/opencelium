package com.becon.opencelium.backend.database.mongodb.service;

import com.becon.opencelium.backend.database.mongodb.entity.ResultMng;
import com.becon.opencelium.backend.resource.connector.ResultResource;
import org.springframework.beans.factory.annotation.Qualifier;
import org.springframework.stereotype.Service;

@Service
public class ResultMngServiceImp implements ResultMngService{
    private final BodyMngService bodyMngService;

    public ResultMngServiceImp(@Qualifier("bodyMngServiceImp") BodyMngService bodyMngService) {
        this.bodyMngService = bodyMngService;
    }

    @Override
    public ResultMng toEntity(ResultResource resultDTO) {
        ResultMng resultMng = new ResultMng();
        resultMng.setStatus(resultDTO.getStatus());
        resultMng.setHeader(resultDTO.getHeader());
        resultMng.setBody(bodyMngService.toEntity(resultDTO.getBody()));
        return resultMng;
    }

    @Override
    public ResultResource toDTO(ResultMng resultMng) {
        ResultResource resultDTO = new ResultResource();
        resultDTO.setHeader(resultMng.getHeader());
        resultDTO.setStatus(resultMng.getStatus());
        resultDTO.setBody(bodyMngService.toDTO(resultMng.getBody()));
        return resultDTO;
    }
}
