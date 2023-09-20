package com.becon.opencelium.backend.database.mongodb.service;

import com.becon.opencelium.backend.database.mongodb.entity.ConditionMng;
import com.becon.opencelium.backend.resource.connection.ConditionDTO;
import org.springframework.beans.factory.annotation.Qualifier;
import org.springframework.stereotype.Service;

@Service
public class ConditionMngServiceImp implements ConditionMngService{
    private final StatementMngService statementMngService;

    public ConditionMngServiceImp(@Qualifier("statementMngServiceImp") StatementMngService statementMngService) {
        this.statementMngService = statementMngService;
    }

    @Override
    public ConditionDTO toDTO(ConditionMng conditionMng) {
        ConditionDTO conditionDTO = new ConditionDTO();
        conditionDTO.setRelationalOperator(conditionMng.getRelationalOperator());
        conditionDTO.setRightStatement(statementMngService.toDTO(conditionMng.getRightStatement()));
        conditionDTO.setLeftStatement(statementMngService.toDTO(conditionMng.getLeftStatement()));
        return conditionDTO;
    }

    @Override
    public ConditionMng toEntity(ConditionDTO conditionDTO) {
        ConditionMng conditionMng = new ConditionMng();
        conditionMng.setRelationalOperator(conditionDTO.getRelationalOperator());
        conditionMng.setRightStatement(statementMngService.toEntity(conditionDTO.getRightStatement()));
        conditionMng.setLeftStatement(statementMngService.toEntity(conditionDTO.getLeftStatement()));
        return conditionMng;
    }
}
