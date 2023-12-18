package com.becon.opencelium.backend.mapper.mongo;

import com.becon.opencelium.backend.database.mongodb.entity.ResponseMng;
import com.becon.opencelium.backend.resource.connector.ResponseDTO;
import com.becon.opencelium.backend.mapper.base.Mapper;
import org.mapstruct.Mapping;
import org.mapstruct.Mappings;
import org.mapstruct.Named;
import org.mapstruct.ReportingPolicy;

@org.mapstruct.Mapper(
        componentModel = "spring",
        uses = ResultMngMapper.class,
        unmappedTargetPolicy = ReportingPolicy.IGNORE,
        unmappedSourcePolicy = ReportingPolicy.IGNORE
)
@Named("responseMngMapper")
public interface ResponseMngMapper extends Mapper<ResponseMng, ResponseDTO>{
    @Named("toDTO")
    @Mappings({
            @Mapping(target = "success", qualifiedByName = {"resultMngMapper", "toDTO"}),
            @Mapping(target = "fail", qualifiedByName = {"resultMngMapper", "toDTO"}),
            @Mapping(target = "name", ignore = true)
    })
    ResponseDTO toDTO(ResponseMng responseMng);

    @Named("toEntity")
    @Mappings({
            @Mapping(target = "success", qualifiedByName = {"resultMngMapper", "toEntity"}),
            @Mapping(target = "fail", qualifiedByName = {"resultMngMapper", "toEntity"})
    })
    ResponseMng toEntity(ResponseDTO responseDTO);
}
