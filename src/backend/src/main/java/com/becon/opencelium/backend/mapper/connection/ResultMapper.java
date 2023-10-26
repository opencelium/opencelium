package com.becon.opencelium.backend.mapper.connection;

import com.becon.opencelium.backend.database.mongodb.entity.ResultMng;
import com.becon.opencelium.backend.resource.connector.ResultDTO;
import org.mapstruct.Mapper;
import org.mapstruct.Mapping;
import org.mapstruct.Named;
import org.mapstruct.ReportingPolicy;

@Mapper(
        unmappedTargetPolicy = ReportingPolicy.IGNORE,
        componentModel = "spring",
        uses = BodyMapper.class
)
@Named("resultMapper")
public interface ResultMapper {
    @Named("toDTO")
    @Mapping(target = "body", qualifiedByName = {"bodyMapper","toDTO"})
    ResultDTO toDTO(ResultMng resultMng);

    @Named("toEntity")
    @Mapping(target = "body", qualifiedByName = {"bodyMapper","toEntity"})
    ResultMng toEntity(ResultDTO resultDTO);
}
