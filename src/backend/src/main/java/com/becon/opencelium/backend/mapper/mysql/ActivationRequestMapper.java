package com.becon.opencelium.backend.mapper.mysql;

import com.becon.opencelium.backend.database.mysql.entity.ActivationRequest;
import com.becon.opencelium.backend.license.ActivationRequestDTO;
import com.becon.opencelium.backend.mapper.base.Mapper;
import org.mapstruct.Mapping;
import org.mapstruct.ReportingPolicy;

@org.mapstruct.Mapper(
        componentModel = "spring",
        unmappedTargetPolicy = ReportingPolicy.IGNORE,
        unmappedSourcePolicy = ReportingPolicy.IGNORE
)
public interface ActivationRequestMapper extends Mapper<ActivationRequest, ActivationRequestDTO> {
    @Mapping(target = "ttl", ignore = true)
    ActivationRequest toEntity(ActivationRequestDTO dto);

    ActivationRequestDTO toDTO(ActivationRequest entity);
}
