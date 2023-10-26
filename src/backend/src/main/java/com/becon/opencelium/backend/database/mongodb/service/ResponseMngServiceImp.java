package com.becon.opencelium.backend.database.mongodb.service;

import com.becon.opencelium.backend.database.mongodb.entity.ResponseMng;
import com.becon.opencelium.backend.resource.connector.ResponseDTO;
import org.springframework.beans.factory.annotation.Qualifier;
import org.springframework.stereotype.Service;

@Service
public class ResponseMngServiceImp implements ResponseMngService{
    private final ResultMngService resultMngService;

    public ResponseMngServiceImp(@Qualifier("resultMngServiceImp") ResultMngService resultMngService) {
        this.resultMngService = resultMngService;
    }

    @Override
    public ResponseMng toEntity(ResponseDTO responseDTO) {
        ResponseMng responseMng = new ResponseMng();
        responseMng.setName(responseDTO.getName());
        responseMng.setSuccess(resultMngService.toEntity(responseDTO.getSuccess()));
        responseMng.setFail(resultMngService.toEntity(responseDTO.getFail()));
        return responseMng;
    }


    @Override
    public ResponseDTO toDTO(ResponseMng responseMng) {
        ResponseDTO responseDTO = new ResponseDTO();
        responseDTO.setSuccess(resultMngService.toDTO(responseMng.getSuccess()));
        responseDTO.setFail(resultMngService.toDTO(responseMng.getFail()));
        return responseDTO;
    }
}
