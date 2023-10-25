package com.becon.opencelium.backend.database.mongodb.service;

import com.becon.opencelium.backend.database.mongodb.entity.RequestMng;
import com.becon.opencelium.backend.resource.connector.RequestDTO;
import org.springframework.beans.factory.annotation.Qualifier;
import org.springframework.stereotype.Service;

@Service
public class RequestMngServiceImp implements RequestMngService{
    private final BodyMngService bodyMngService;

    public RequestMngServiceImp(@Qualifier("bodyMngServiceImp") BodyMngService bodyMngService) {
        this.bodyMngService = bodyMngService;
    }

    @Override
    public RequestMng toEntity(RequestDTO requestDTO) {
        RequestMng requestMng = new RequestMng();
        requestMng.setEndpoint(requestDTO.getEndpoint());
        requestMng.setMethod(requestDTO.getMethod());
        requestMng.setHeader(requestDTO.getHeader());
        requestMng.setBody(bodyMngService.toEntity(requestDTO.getBody()));
        return requestMng;
    }


    @Override
    public RequestDTO toDTO(RequestMng requestMng) {
        RequestDTO requestDTO = new RequestDTO();
        requestDTO.setHeader(requestMng.getHeader());
        requestDTO.setMethod(requestMng.getMethod());
        requestDTO.setEndpoint(requestMng.getEndpoint());
        requestDTO.setBody(bodyMngService.toDTO(requestMng.getBody()));
        return requestDTO;
    }
}
