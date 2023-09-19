package com.becon.opencelium.backend.database.mongodb.service;

import com.becon.opencelium.backend.database.mongodb.entity.InvokerMng;
import com.becon.opencelium.backend.resource.connector.InvokerDTO;
import org.springframework.stereotype.Service;

@Service
public class InvokerMngServiceImp implements InvokerMngService{

    @Override
    public InvokerMng toEntity(InvokerDTO invokerDTO) {
        InvokerMng invokerMng = new InvokerMng();
        invokerMng.setName(invokerDTO.getName());
        invokerMng.setDescription(invokerDTO.getDescription());
        invokerMng.setIcon(invokerDTO.getIcon());
        invokerMng.setHint(invokerDTO.getHint());
        invokerMng.setAuthType(invokerDTO.getAuthType());
        invokerMng.setRequiredData(invokerDTO.getRequiredData());
        return invokerMng;
    }
}
