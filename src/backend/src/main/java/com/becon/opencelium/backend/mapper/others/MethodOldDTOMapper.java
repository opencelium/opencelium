package com.becon.opencelium.backend.mapper.others;

import com.becon.opencelium.backend.mapper.base.Mapper;
import com.becon.opencelium.backend.resource.connection.MethodDTO;
import com.becon.opencelium.backend.resource.connection.old.MethodOldDTO;
import org.mapstruct.Mapping;
import org.mapstruct.Named;
import org.mapstruct.ReportingPolicy;

import java.util.List;

@org.mapstruct.Mapper(
        componentModel = "spring",
        unmappedTargetPolicy = ReportingPolicy.IGNORE,
        unmappedSourcePolicy = ReportingPolicy.IGNORE
)
@Named("methodOldDTOMapper")
public interface MethodOldDTOMapper extends Mapper<MethodDTO, MethodOldDTO> {
    @Named("toDTO")
    @Mapping(target = "id", source = "nodeId")
    MethodDTO toEntity(MethodOldDTO dto);

    @Named("toOldDTO")
    @Mapping(target = "nodeId", source = "id")
    MethodOldDTO toDTO(MethodDTO entity);

    @Named("toDTOAll")
    @Override
    default List<MethodDTO> toEntityAll(List<MethodOldDTO> dtos) {
        return Mapper.super.toEntityAll(dtos);
    }

    @Named("toOldDTOAll")
    @Override
    default List<MethodOldDTO> toDTOAll(List<MethodDTO> entities) {
        return Mapper.super.toDTOAll(entities);
    }
}
