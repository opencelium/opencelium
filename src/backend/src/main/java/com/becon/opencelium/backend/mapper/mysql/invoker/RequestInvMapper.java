package com.becon.opencelium.backend.mapper.mysql.invoker;

import com.becon.opencelium.backend.invoker.entity.RequestInv;
import com.becon.opencelium.backend.mapper.base.Mapper;
import com.becon.opencelium.backend.mapper.mysql.BodyMapper;
import com.becon.opencelium.backend.resource.connector.RequestDTO;
import org.mapstruct.Mapping;
import org.mapstruct.Named;
import org.mapstruct.ReportingPolicy;

@org.mapstruct.Mapper(
        componentModel = "spring",
        unmappedTargetPolicy = ReportingPolicy.IGNORE,
        unmappedSourcePolicy = ReportingPolicy.IGNORE,
        uses = BodyMapper.class
)
@Named("requestInvMapper")
public interface RequestInvMapper extends Mapper<RequestInv, RequestDTO> {
    @Named("toEntity")
    @Mapping(target = "body", qualifiedByName = {"bodyMapper", "toEntity"})
    RequestInv toEntity(RequestDTO dto);

    @Named("toDTO")
    @Mapping(target = "body", qualifiedByName = {"bodyMapper", "toDTO"})
    RequestDTO toDTO(RequestInv entity);
}
