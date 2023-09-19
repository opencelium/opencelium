package com.becon.opencelium.backend.database.mongodb.service;

import com.becon.opencelium.backend.database.mongodb.entity.RequestMng;
import com.becon.opencelium.backend.resource.connector.RequestResource;
import org.springframework.beans.factory.annotation.Qualifier;
import org.springframework.stereotype.Service;

@Service
public class RequestMngServiceImp implements RequestMngService{
    private final BodyMngService bodyMngService;

    public RequestMngServiceImp(@Qualifier("bodyMngServiceImp") BodyMngService bodyMngService) {
        this.bodyMngService = bodyMngService;
    }

    @Override
    public RequestMng toEntity(RequestResource requestDTO) {
        RequestMng requestMng = new RequestMng();
        requestMng.setEndpoint(requestDTO.getEndpoint());
        requestMng.setMethod(requestDTO.getMethod());
        requestMng.setHeader(requestDTO.getHeader());
        requestMng.setBody(bodyMngService.toEntity(requestDTO.getBody()));
        return requestMng;
    }


    @Override
    public RequestResource toDTO(RequestMng requestMng) {
        RequestResource requestDTO = new RequestResource();
        requestDTO.setHeader(requestMng.getHeader());
        requestDTO.setMethod(requestMng.getMethod());
        requestDTO.setEndpoint(requestMng.getEndpoint());
        requestDTO.setBody(bodyMngService.toDTO(requestMng.getBody()));
        return requestDTO;
    }
}
