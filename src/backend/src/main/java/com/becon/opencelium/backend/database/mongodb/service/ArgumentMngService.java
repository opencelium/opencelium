package com.becon.opencelium.backend.database.mongodb.service;

import com.becon.opencelium.backend.database.mongodb.entity.ArgumentMng;
import com.becon.opencelium.backend.resource.connection.aggregator.ArgumentDTO;

import java.util.List;
import java.util.Set;

public interface ArgumentMngService {
    ArgumentMng toEntity(ArgumentDTO argumentDTO);
    Set<ArgumentMng> toEntityAll(Set<ArgumentDTO> argumentDTOs);
    Set<ArgumentDTO> toDTOAll(Set<ArgumentMng> args);
    ArgumentDTO toDTO(ArgumentMng args);
}
