package com.becon.opencelium.backend.mapper.mysql;

import com.becon.opencelium.backend.database.mysql.entity.ActivationRequest;
import com.becon.opencelium.backend.license.ActivationRequestResponse;
import com.becon.opencelium.backend.mapper.base.Mapper;
import org.mapstruct.Mapping;
import org.mapstruct.ReportingPolicy;

import java.time.Instant;

@org.mapstruct.Mapper(
        componentModel = "spring",
        unmappedTargetPolicy = ReportingPolicy.IGNORE,
        unmappedSourcePolicy = ReportingPolicy.IGNORE,
        imports = Instant.class
)
public interface ActivationRequesResMapper extends Mapper<ActivationRequest, ActivationRequestResponse> {
    @Mapping(target = "ttl", ignore = true)
    @Mapping(target = "createdAt", expression = "java(Instant.ofEpochSecond(dto.getCreatedAt()))")
    ActivationRequest toEntity(ActivationRequestResponse dto);

    @Mapping(target = "createdAt", expression = "java(entity.getCreatedAt().getEpochSecond())")
    ActivationRequestResponse toDTO(ActivationRequest entity);
}
