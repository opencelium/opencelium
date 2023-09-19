package com.becon.opencelium.backend.database.mongodb.service;

import com.becon.opencelium.backend.database.mongodb.entity.OperatorMng;
import com.becon.opencelium.backend.resource.connection.OperatorDTO;
import org.springframework.beans.factory.annotation.Qualifier;
import org.springframework.stereotype.Service;

import java.util.ArrayList;
import java.util.List;

@Service
public class OperatorMngServiceImp implements OperatorMngService{
    private final ConditionMngService conditionMngService;

    public OperatorMngServiceImp(
            @Qualifier("conditionMngServiceImp") ConditionMngService conditionMngService
    ) {
        this.conditionMngService = conditionMngService;
    }

    @Override
    public OperatorMng toEntity(OperatorDTO operatorDTO){
        OperatorMng operatorMng = new OperatorMng();
        operatorMng.setIndex(operatorDTO.getIndex());
        operatorMng.setIterator(operatorDTO.getIterator());
        operatorMng.setType(operatorDTO.getType());
        operatorMng.setCondition(conditionMngService.toEntity(operatorDTO.getCondition()));
        return operatorMng;
    }
    @Override
    public List<OperatorMng> toEntityAll(List<OperatorDTO> operatorDTOs) {
        ArrayList<OperatorMng> operatorMngs = new ArrayList<>();
        for (OperatorDTO operatorDTO : operatorDTOs) {
            operatorMngs.add(toEntity(operatorDTO));
        }
        return operatorMngs;
    }


    @Override
    public List<OperatorDTO> toDTOAll(List<OperatorMng> operatorMngs) {
        ArrayList<OperatorDTO> operatorDTOS = new ArrayList<>();
        for (OperatorMng operatorMng : operatorMngs) {
            operatorDTOS.add(toDTO(operatorMng));
        }
        return operatorDTOS;
    }

    @Override
    public OperatorDTO toDTO(OperatorMng operatorMng) {
        OperatorDTO operatorDTO = new OperatorDTO();
        operatorDTO.setNodeId(operatorMng.getId());
        operatorDTO.setIndex(operatorMng.getIndex());
        operatorDTO.setIterator(operatorMng.getIterator());
        operatorDTO.setType(operatorMng.getType());
        operatorDTO.setCondition(conditionMngService.toDTO(operatorMng.getCondition()));
        return operatorDTO;
    }
}
