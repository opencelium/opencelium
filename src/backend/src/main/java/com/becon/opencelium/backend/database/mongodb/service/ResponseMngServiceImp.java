package com.becon.opencelium.backend.database.mongodb.service;

import com.becon.opencelium.backend.database.mongodb.entity.ResponseMng;
import com.becon.opencelium.backend.resource.connector.ResponseResource;
import org.springframework.beans.factory.annotation.Qualifier;
import org.springframework.stereotype.Service;

@Service
public class ResponseMngServiceImp implements ResponseMngService{
    private final ResultMngService resultMngService;

    public ResponseMngServiceImp(@Qualifier("resultMngServiceImp") ResultMngService resultMngService) {
        this.resultMngService = resultMngService;
    }

    @Override
    public ResponseMng toEntity(ResponseResource responseDTO) {
        ResponseMng responseMng = new ResponseMng();
        responseMng.setName(responseDTO.getName());
        responseMng.setSuccess(resultMngService.toEntity(responseDTO.getSuccess()));
        responseMng.setFail(resultMngService.toEntity(responseDTO.getFail()));
        return responseMng;
    }


    @Override
    public ResponseResource toDTO(ResponseMng responseMng) {
        ResponseResource responseDTO = new ResponseResource();
        responseDTO.setSuccess(resultMngService.toDTO(responseMng.getSuccess()));
        responseDTO.setFail(resultMngService.toDTO(responseMng.getFail()));
        return responseDTO;
    }
}
