package com.becon.opencelium.backend.mapper.mongo;

import com.becon.opencelium.backend.database.mongodb.entity.ResultMng;
import com.becon.opencelium.backend.resource.connector.ResultDTO;
import com.becon.opencelium.backend.mapper.base.Mapper;
import org.mapstruct.Mapping;
import org.mapstruct.Named;
import org.mapstruct.ReportingPolicy;

@org.mapstruct.Mapper(
        unmappedTargetPolicy = ReportingPolicy.IGNORE,
        componentModel = "spring",
        uses = BodyMngMapper.class
)
@Named("resultMngMapper")
public interface ResultMngMapper extends Mapper<ResultMng, ResultDTO>{
    @Named("toDTO")
    @Mapping(target = "body", qualifiedByName = {"bodyMngMapper","toDTO"})
    ResultDTO toDTO(ResultMng resultMng);

    @Named("toEntity")
    @Mapping(target = "body", qualifiedByName = {"bodyMngMapper","toEntity"})
    ResultMng toEntity(ResultDTO resultDTO);
}
