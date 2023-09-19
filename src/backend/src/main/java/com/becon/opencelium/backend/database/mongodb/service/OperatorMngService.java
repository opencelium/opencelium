package com.becon.opencelium.backend.database.mongodb.service;

import com.becon.opencelium.backend.database.mongodb.entity.OperatorMng;
import com.becon.opencelium.backend.resource.connection.OperatorDTO;

import java.util.List;

public interface OperatorMngService {
    OperatorMng toEntity(OperatorDTO operatorDTO);
    List<OperatorMng> toEntityAll(List<OperatorDTO> operatorDTOs);
    List<OperatorDTO> toDTOAll(List<OperatorMng> operatorMngs);
    OperatorDTO toDTO(OperatorMng operatorMng);
}
