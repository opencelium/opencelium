package com.becon.opencelium.backend.mapper.mysql;

import com.becon.opencelium.backend.database.mysql.entity.ActivationRequest;
import com.becon.opencelium.backend.mapper.base.Mapper;
import com.becon.opencelium.backend.subscription.dto.ActivationRequestDTO;
import org.mapstruct.Mapping;
import org.mapstruct.ReportingPolicy;

import java.time.Instant;
import java.time.LocalDateTime;
import java.time.ZoneId;

@org.mapstruct.Mapper(
        componentModel = "spring",
        unmappedTargetPolicy = ReportingPolicy.IGNORE,
        unmappedSourcePolicy = ReportingPolicy.IGNORE
)
public interface ActivationRequestMapper extends Mapper<ActivationRequest, ActivationRequestDTO> {
    @Mapping(target = "ttl", ignore = true)
    @Mapping(source = "createdAt", target = "createdAt")
    ActivationRequest toEntity(ActivationRequestDTO dto);

    ActivationRequestDTO toDTO(ActivationRequest entity);

    default LocalDateTime map(long value) {
        // Convert long (epoch timestamp) to LocalDateTime
        return LocalDateTime.ofInstant(Instant.ofEpochMilli(value), ZoneId.systemDefault());
    }

    default long map(LocalDateTime value) {
        // Convert LocalDateTime to long (epoch timestamp)
        return value.atZone(ZoneId.systemDefault()).toInstant().toEpochMilli();
    }
}
