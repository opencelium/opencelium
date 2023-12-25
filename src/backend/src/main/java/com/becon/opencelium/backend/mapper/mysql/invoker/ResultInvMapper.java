package com.becon.opencelium.backend.mapper.mysql.invoker;

import com.becon.opencelium.backend.invoker.entity.ResultInv;
import com.becon.opencelium.backend.mapper.base.Mapper;
import com.becon.opencelium.backend.mapper.mysql.BodyMapper;
import com.becon.opencelium.backend.resource.connector.ResultDTO;
import org.mapstruct.Mapping;
import org.mapstruct.Named;
import org.mapstruct.ReportingPolicy;

@org.mapstruct.Mapper(
        componentModel = "spring",
        unmappedTargetPolicy = ReportingPolicy.IGNORE,
        unmappedSourcePolicy = ReportingPolicy.IGNORE,
        uses = BodyMapper.class
)
@Named("resultInvMapper")
public interface ResultInvMapper extends Mapper<ResultInv, ResultDTO> {
    @Named("toEntity")
    @Mapping(target = "body", qualifiedByName = {"bodyMapper", "toEntity"})
    ResultInv toEntity(ResultDTO dto);

    @Named("toDTO")
    @Mapping(target = "body", qualifiedByName = {"bodyMapper", "toDTO"})
    ResultDTO toDTO(ResultInv entity);
}
