package com.becon.opencelium.backend.database.mysql.service;
import com.becon.opencelium.backend.database.mysql.entity.Argument;
import com.becon.opencelium.backend.resource.connection.aggregator.ArgumentDTO;

import java.util.Optional;

public interface ArgumentService {
    ArgumentDTO convertToDto(Argument argument);
    Argument convertToEntity(ArgumentDTO argumentDTO);

    void deleteById(Integer argId);
    Optional<Argument> findById(int argId);
}
