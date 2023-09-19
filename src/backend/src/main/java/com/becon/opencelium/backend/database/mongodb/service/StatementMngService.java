package com.becon.opencelium.backend.database.mongodb.service;

import com.becon.opencelium.backend.database.mongodb.entity.StatementMng;
import com.becon.opencelium.backend.resource.connection.StatementDTO;
import org.springframework.stereotype.Service;

public interface StatementMngService {
    StatementMng toEntity(StatementDTO statementDTO);

    StatementDTO toDTO(StatementMng statementMng);
}
