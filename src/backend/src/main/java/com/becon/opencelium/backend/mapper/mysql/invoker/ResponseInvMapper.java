package com.becon.opencelium.backend.mapper.mysql.invoker;

import com.becon.opencelium.backend.invoker.entity.ResponseInv;
import com.becon.opencelium.backend.mapper.base.Mapper;
import com.becon.opencelium.backend.mapper.mysql.BodyMapper;
import com.becon.opencelium.backend.resource.connector.ResponseDTO;
import org.mapstruct.Mapping;
import org.mapstruct.Mappings;
import org.mapstruct.Named;
import org.mapstruct.ReportingPolicy;

@org.mapstruct.Mapper(
        componentModel = "spring",
        unmappedTargetPolicy = ReportingPolicy.IGNORE,
        unmappedSourcePolicy = ReportingPolicy.IGNORE,
        uses = ResultInvMapper.class
)
@Named("responseInvMapper")
public interface ResponseInvMapper extends Mapper<ResponseInv, ResponseDTO> {
    @Named("toEntity")
    @Mappings({
            @Mapping(target = "success", qualifiedByName = {"resultInvMapper", "toEntity"}),
            @Mapping(target = "fail", qualifiedByName = {"resultInvMapper", "toEntity"})
    })
    ResponseInv toEntity(ResponseDTO dto);

    @Named("toDTO")
    @Mappings({
            @Mapping(target = "success", qualifiedByName = {"resultInvMapper", "toDTO"}),
            @Mapping(target = "fail", qualifiedByName = {"resultInvMapper", "toDTO"}),
            @Mapping(target = "name", ignore = true)
    })
    ResponseDTO toDTO(ResponseInv entity);
}
