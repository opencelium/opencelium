package com.becon.opencelium.backend.database.mongodb.service;

import com.becon.opencelium.backend.database.mongodb.entity.FieldBindingMng;
import com.becon.opencelium.backend.resource.connection.binding.FieldBindingDTO;
import org.springframework.beans.factory.annotation.Qualifier;
import org.springframework.stereotype.Service;

import java.util.ArrayList;
import java.util.List;

@Service
public class FieldBindingMngServiceImp implements FieldBindingMngService{
    private final LinkedFieldMngService linkedFieldMngService;
    private final EnhancementMngService enhancementMngService;

    public FieldBindingMngServiceImp(
            @Qualifier("linkedFieldMngServiceImp") LinkedFieldMngService linkedFieldMngService,
            @Qualifier("enhancementMngServiceImp") EnhancementMngService enhancementMngService
    ) {
        this.linkedFieldMngService = linkedFieldMngService;
        this.enhancementMngService = enhancementMngService;
    }

    @Override
    public FieldBindingMng toEntity(FieldBindingDTO fieldBindingDTO){
        FieldBindingMng fieldBindingMng = new FieldBindingMng();
        fieldBindingMng.setTo(linkedFieldMngService.toEntityAll(fieldBindingDTO.getTo()));
        fieldBindingMng.setFrom(linkedFieldMngService.toEntityAll(fieldBindingDTO.getFrom()));
        fieldBindingMng.setEnhancement(enhancementMngService.toEntity(fieldBindingDTO.getEnhancement()));
        return fieldBindingMng;
    }
    @Override
    public List<FieldBindingMng> toEntityAll(List<FieldBindingDTO> fieldBindingDTOs) {
        ArrayList<FieldBindingMng> fieldBindingMngs = new ArrayList<>();
        for (FieldBindingDTO fieldBindingDTO : fieldBindingDTOs) {
            fieldBindingMngs.add(toEntity(fieldBindingDTO));
        }
        return fieldBindingMngs;
    }

    @Override
    public List<FieldBindingDTO> toDTOAll(List<FieldBindingMng> fieldBindingMngs) {
        ArrayList<FieldBindingDTO> fieldBindingDTOS = new ArrayList<>();
        for (FieldBindingMng fieldBindingMng : fieldBindingMngs) {
            fieldBindingDTOS.add(toDTO(fieldBindingMng));
        }
        return fieldBindingDTOS;
    }

    @Override
    public FieldBindingDTO toDTO(FieldBindingMng fieldBindingMng) {
        FieldBindingDTO fieldBindingDTO = new FieldBindingDTO();
        fieldBindingDTO.setEnhancement(enhancementMngService.toDTO(fieldBindingMng.getEnhancement()));
        fieldBindingDTO.setFrom(linkedFieldMngService.toDTOAll(fieldBindingMng.getFrom()));
        fieldBindingDTO.setTo(linkedFieldMngService.toDTOAll(fieldBindingMng.getTo()));
        return fieldBindingDTO;
    }
}
