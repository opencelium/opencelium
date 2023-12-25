package com.becon.opencelium.backend.mapper.mysql.invoker;

import com.becon.opencelium.backend.invoker.entity.FunctionInvoker;
import com.becon.opencelium.backend.mapper.base.Mapper;
import com.becon.opencelium.backend.resource.connector.FunctionDTO;
import org.mapstruct.Mapping;
import org.mapstruct.Mappings;
import org.mapstruct.Named;
import org.mapstruct.ReportingPolicy;

import java.util.List;

@org.mapstruct.Mapper(
        componentModel = "spring",
        unmappedTargetPolicy = ReportingPolicy.IGNORE,
        unmappedSourcePolicy = ReportingPolicy.IGNORE,
        uses = {
              RequestInvMapper.class,
              ResponseInvMapper.class
        }
)
@Named("functionInvMapper")
public interface FunctionInvMapper extends Mapper<FunctionInvoker, FunctionDTO> {
    @Named("toEntity")
    @Mappings({
            @Mapping(target = "request", qualifiedByName = {"requestInvMapper", "toEntity"}),
            @Mapping(target = "response", qualifiedByName = {"responseInvMapper", "toEntity"})
    })
    FunctionInvoker toEntity(FunctionDTO dto);

    @Named("toDTO")
    @Mappings({
            @Mapping(target = "request", qualifiedByName = {"requestInvMapper", "toDTO"}),
            @Mapping(target = "response", qualifiedByName = {"responseInvMapper", "toDTO"})
    })
    FunctionDTO toDTO(FunctionInvoker entity);

    @Named("toEntityAll")
    default List<FunctionInvoker> toEntityAll(List<FunctionDTO> dtos) {
        return Mapper.super.toEntityAll(dtos);
    }

    @Named("toDTOAll")
    default List<FunctionDTO> toDTOAll(List<FunctionInvoker> entities) {
        return Mapper.super.toDTOAll(entities);
    }
}
