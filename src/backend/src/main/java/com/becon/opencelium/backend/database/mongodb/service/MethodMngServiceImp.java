    package com.becon.opencelium.backend.database.mongodb.service;

import com.becon.opencelium.backend.database.mongodb.entity.MethodMng;
import com.becon.opencelium.backend.resource.connection.MethodDTO;
import org.springframework.beans.factory.annotation.Qualifier;
import org.springframework.stereotype.Service;

import java.util.ArrayList;
import java.util.List;

@Service
public class MethodMngServiceImp implements MethodMngService{
    private final RequestMngService requestMngService;
    private final ResponseMngService responseMngService;

    public MethodMngServiceImp(
            @Qualifier("requestMngServiceImp") RequestMngService requestMngService,
            @Qualifier("responseMngServiceImp") ResponseMngService responseMngService
    ) {
        this.requestMngService = requestMngService;
        this.responseMngService = responseMngService;
    }

    @Override
    public MethodMng toEntity(MethodDTO methodDTO){
        MethodMng methodMng = new MethodMng();
        methodMng.setName(methodDTO.getName());
        methodMng.setIndex(methodDTO.getIndex());
        methodMng.setLabel(methodDTO.getLabel());
        methodMng.setColor(methodDTO.getColor());
        methodMng.setDataAggregator(methodDTO.getDataAggregator());
        methodMng.setRequest(requestMngService.toEntity(methodDTO.getRequest()));
        methodMng.setResponse(responseMngService.toEntity(methodDTO.getResponse()));
        return methodMng;
    }
    @Override
    public List<MethodMng> toEntityAll(List<MethodDTO> methodDTOs) {
        ArrayList<MethodMng> methods = new ArrayList<>();
        for (MethodDTO methodDTO : methodDTOs) {
            methods.add(toEntity(methodDTO));
        }
        return methods;
    }

    @Override
    public List<MethodDTO> toDTOAll(List<MethodMng> methods) {
        ArrayList<MethodDTO> methodDTOS = new ArrayList<>();
        for (MethodMng method : methods) {
            methodDTOS.add(toDTO(method));
        }
        return methodDTOS;
    }

    @Override
    public MethodDTO toDTO(MethodMng methodMng) {
        MethodDTO methodDTO = new MethodDTO();
        methodDTO.setNodeId(methodMng.getId());
        methodDTO.setColor(methodMng.getColor());
        methodDTO.setIndex(methodMng.getIndex());
        methodDTO.setLabel(methodMng.getLabel());
        methodDTO.setName(methodMng.getName());
        methodDTO.setDataAggregator(methodMng.getDataAggregator());
        methodDTO.setRequest(requestMngService.toDTO(methodMng.getRequest()));
        methodDTO.setResponse(responseMngService.toDTO(methodMng.getResponse()));
        return methodDTO;
    }
}
