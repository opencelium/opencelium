package com.becon.opencelium.backend.database.mongodb.service;

import com.becon.opencelium.backend.database.mongodb.entity.LinkedFieldMng;
import com.becon.opencelium.backend.resource.connection.binding.LinkedFieldDTO;
import org.springframework.stereotype.Service;

import java.util.ArrayList;
import java.util.List;

@Service
public class LinkedFieldMngServiceImp implements LinkedFieldMngService{

    @Override
    public LinkedFieldMng toEntity(LinkedFieldDTO linkedFieldDTO){
        LinkedFieldMng linkedFieldMng = new LinkedFieldMng();
        linkedFieldMng.setType(linkedFieldDTO.getType());
        linkedFieldMng.setField(linkedFieldDTO.getField());
        linkedFieldMng.setColor(linkedFieldDTO.getColor());
        return linkedFieldMng;
    }
    @Override
    public List<LinkedFieldMng> toEntityAll(List<LinkedFieldDTO> linkedFieldDTOs) {
        ArrayList<LinkedFieldMng> linkedFieldMngs = new ArrayList<>();
        for (LinkedFieldDTO linkedFieldDTO : linkedFieldDTOs) {
            linkedFieldMngs.add(toEntity(linkedFieldDTO));
        }
        return linkedFieldMngs;
    }

    @Override
    public List<LinkedFieldDTO> toDTOAll(List<LinkedFieldMng> linkedFieldMngs) {
        ArrayList<LinkedFieldDTO> linkedFieldDTOS = new ArrayList<>();
        for (LinkedFieldMng linkedFieldMng : linkedFieldMngs) {
            linkedFieldDTOS.add(toDTO(linkedFieldMng));
        }
        return linkedFieldDTOS;
    }

    @Override
    public LinkedFieldDTO toDTO(LinkedFieldMng linkedFieldMng) {
        LinkedFieldDTO linkedFieldDTO = new LinkedFieldDTO();
        linkedFieldDTO.setColor(linkedFieldMng.getColor());
        linkedFieldDTO.setField(linkedFieldMng.getField());
        linkedFieldDTO.setType(linkedFieldMng.getType());
        return linkedFieldDTO;
    }
}
