package com.becon.opencelium.backend.mapper.connection;

import com.becon.opencelium.backend.database.mongodb.entity.RequestMng;
import com.becon.opencelium.backend.resource.connector.RequestDTO;
import org.mapstruct.Mapper;
import org.mapstruct.Mapping;
import org.mapstruct.Named;
import org.mapstruct.ReportingPolicy;

@Mapper(
        componentModel = "spring",
        uses = BodyMapper.class,
        unmappedTargetPolicy = ReportingPolicy.IGNORE,
        unmappedSourcePolicy = ReportingPolicy.IGNORE
)
@Named("requestMapper")
public interface RequestMapper {
    @Named("toDTO")
    @Mapping(target = "body", qualifiedByName = {"bodyMapper","toDTO"})
    RequestDTO toDTO(RequestMng requestMng);

    @Named("toEntity")
    @Mapping(target = "body", qualifiedByName = {"bodyMapper","toEntity"})
    RequestMng toEntity(RequestDTO requestDTO);
}
