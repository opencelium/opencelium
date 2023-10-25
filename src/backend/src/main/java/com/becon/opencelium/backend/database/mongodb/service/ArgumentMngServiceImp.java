package com.becon.opencelium.backend.database.mongodb.service;

import com.becon.opencelium.backend.database.mongodb.entity.ArgumentMng;
import com.becon.opencelium.backend.resource.connection.aggregator.ArgumentDTO;
import org.springframework.stereotype.Service;

import java.util.ArrayList;
import java.util.HashSet;
import java.util.List;
import java.util.Set;

@Service
public class ArgumentMngServiceImp implements ArgumentMngService{

    @Override
    public Set<ArgumentDTO> toDTOAll(Set<ArgumentMng> args) {
        HashSet<ArgumentDTO> argumentDTOS = new HashSet<>();
        for (ArgumentMng arg : args) {
            argumentDTOS.add(toDTO(arg));
        }
        return argumentDTOS;
    }

    @Override
    public ArgumentDTO toDTO(ArgumentMng argumentMng) {
        ArgumentDTO argumentDTO = new ArgumentDTO();
        argumentDTO.setName(argumentMng.getName());
        argumentDTO.setDescription(argumentMng.getDescription());
        return argumentDTO;
    }

    @Override
    public ArgumentMng toEntity(ArgumentDTO argumentDTO){
        ArgumentMng argumentMng = new ArgumentMng();
        argumentMng.setName(argumentMng.getName());
        argumentMng.setDescription(argumentDTO.getDescription());
        return argumentMng;
    }

    @Override
    public Set<ArgumentMng> toEntityAll(Set<ArgumentDTO> argumentDTOs) {
        Set<ArgumentMng> argumentMngs = new HashSet<>();
        for (ArgumentDTO argumentDTO : argumentDTOs) {
            argumentMngs.add(toEntity(argumentDTO));
        }
        return argumentMngs;
    }
}
