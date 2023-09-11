package com.becon.opencelium.backend.database.mysql.service;

import com.becon.opencelium.backend.database.mysql.entity.Argument;
import com.becon.opencelium.backend.resource.connection.aggregator.ArgumentDTO;

public interface ArgumentService {
    ArgumentDTO convertToDto(Argument argument);
    Argument convertToEntity(ArgumentDTO argumentDTO);
}
