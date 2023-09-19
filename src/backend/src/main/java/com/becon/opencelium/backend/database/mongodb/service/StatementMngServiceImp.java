package com.becon.opencelium.backend.database.mongodb.service;

import com.becon.opencelium.backend.database.mongodb.entity.StatementMng;
import com.becon.opencelium.backend.resource.connection.StatementDTO;
import org.springframework.stereotype.Service;

@Service
public class StatementMngServiceImp implements StatementMngService{

    @Override
    public StatementMng toEntity(StatementDTO statementDTO) {
        StatementMng statementMng = new StatementMng();
        statementMng.setRightPropertyValue(statementDTO.getRightPropertyValue());
        statementMng.setType(statementMng.getType());
        statementMng.setField(statementDTO.getField());
        statementMng.setColor(statementDTO.getColor());
        return statementMng;
    }

    @Override
    public StatementDTO toDTO(StatementMng statementMng) {
        StatementDTO statementDTO = new StatementDTO();
        statementDTO.setColor(statementMng.getColor());
        statementDTO.setField(statementMng.getField());
        statementDTO.setType(statementMng.getType());
        statementDTO.setRightPropertyValue(statementMng.getRightPropertyValue());
        return statementDTO;
    }
}
