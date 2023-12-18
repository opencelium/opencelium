package com.becon.opencelium.backend.mapper.mongo;

import com.becon.opencelium.backend.database.mongodb.entity.RequestMng;
import com.becon.opencelium.backend.mapper.base.Mapper;
import com.becon.opencelium.backend.resource.connector.RequestDTO;
import org.mapstruct.Mapping;
import org.mapstruct.Named;
import org.mapstruct.ReportingPolicy;

@org.mapstruct.Mapper(
        componentModel = "spring",
        uses = BodyMngMapper.class,
        unmappedTargetPolicy = ReportingPolicy.IGNORE,
        unmappedSourcePolicy = ReportingPolicy.IGNORE
)
@Named("requestMngMapper")
public interface RequestMngMapper extends Mapper<RequestMng, RequestDTO> {
    @Named("toDTO")
    @Mapping(target = "body", qualifiedByName = {"bodyMngMapper","toDTO"})
    RequestDTO toDTO(RequestMng requestMng);

    @Named("toEntity")
    @Mapping(target = "body", qualifiedByName = {"bodyMngMapper","toEntity"})
    RequestMng toEntity(RequestDTO requestDTO);
}
