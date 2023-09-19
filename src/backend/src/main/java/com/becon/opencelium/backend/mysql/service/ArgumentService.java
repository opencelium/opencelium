package com.becon.opencelium.backend.mysql.service;

import com.becon.opencelium.backend.mysql.entity.Argument;
import com.becon.opencelium.backend.resource.connection.aggregator.ArgumentDTO;

public interface ArgumentService {
    ArgumentDTO convertToDto(Argument argument);
    Argument convertToEntity(ArgumentDTO argumentDTO);

    void deleteById(Integer argId);
}
