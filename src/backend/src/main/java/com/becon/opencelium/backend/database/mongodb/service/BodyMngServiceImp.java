package com.becon.opencelium.backend.database.mongodb.service;

import com.becon.opencelium.backend.database.mongodb.entity.BodyMng;
import com.becon.opencelium.backend.resource.connector.BodyDTO;
import org.springframework.stereotype.Service;

@Service
public class BodyMngServiceImp implements BodyMngService{

    @Override
    public BodyDTO toDTO(BodyMng bodyMng) {
        BodyDTO bodyDTO = new BodyDTO();
        bodyDTO.setData(bodyMng.getData());
        bodyDTO.setType(bodyMng.getType());
        bodyDTO.setFields(bodyMng.getFields());
        bodyDTO.setFormat(bodyMng.getFormat());
        return bodyDTO;
    }

    @Override
    public BodyMng toEntity(BodyDTO bodyDTO) {
        BodyMng bodyMng = new BodyMng();
        bodyMng.setFields(bodyDTO.getFields());
        bodyMng.setData(bodyDTO.getData());
        bodyMng.setFormat(bodyDTO.getFormat());
        bodyMng.setType(bodyDTO.getType());
        return bodyMng;
    }
}
