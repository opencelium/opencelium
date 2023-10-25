package com.becon.opencelium.backend.mapper.connection;

import com.becon.opencelium.backend.database.mongodb.entity.ResponseMng;
import com.becon.opencelium.backend.database.mongodb.entity.ResultMng;
import com.becon.opencelium.backend.resource.connector.ResponseDTO;
import com.becon.opencelium.backend.resource.connector.ResultDTO;
import org.mapstruct.*;

@Mapper(
        componentModel = "spring",
        uses = ResultMapper.class,
        unmappedTargetPolicy = ReportingPolicy.IGNORE,
        unmappedSourcePolicy = ReportingPolicy.IGNORE
)
@Named("responseMapper")
public interface ResponseMapper {
    @Named("toDTO")
    @Mappings({
            @Mapping(target = "success", qualifiedByName = {"resultMapper", "toDTO"}),
            @Mapping(target = "fail", qualifiedByName = {"resultMapper", "toDTO"}),
            @Mapping(target = "name", ignore = true)
    })
    ResponseDTO toDTO(ResponseMng responseMng);

    @Named("toEntity")
    @Mappings({
            @Mapping(target = "success", qualifiedByName = {"resultMapper", "toEntity"}),
            @Mapping(target = "fail", qualifiedByName = {"resultMapper", "toEntity"})
    })
    ResponseMng toEntity(ResponseDTO responseDTO);
}
