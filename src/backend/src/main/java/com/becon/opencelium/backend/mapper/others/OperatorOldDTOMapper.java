package com.becon.opencelium.backend.mapper.others;

import com.becon.opencelium.backend.mapper.base.Mapper;
import com.becon.opencelium.backend.resource.connection.OperatorDTO;
import com.becon.opencelium.backend.resource.connection.old.OperatorOldDTO;
import org.mapstruct.Mapping;
import org.mapstruct.Named;
import org.mapstruct.ReportingPolicy;

import java.util.List;

@org.mapstruct.Mapper(
        componentModel = "spring",
        unmappedTargetPolicy = ReportingPolicy.IGNORE,
        unmappedSourcePolicy = ReportingPolicy.IGNORE
)
@Named("operatorOldDTOMapper")
public interface OperatorOldDTOMapper extends Mapper<OperatorDTO, OperatorOldDTO> {
    @Named("toDTO")
    @Mapping(target = "id", source = "nodeId")
    OperatorDTO toEntity(OperatorOldDTO dto);

    @Named("toOldDTO")
    @Mapping(target = "nodeId", source = "id")
    OperatorOldDTO toDTO(OperatorDTO entity);

    @Named("toDTOAll")
    @Override
    default List<OperatorDTO> toEntityAll(List<OperatorOldDTO> dtos) {
        return Mapper.super.toEntityAll(dtos);
    }

    @Named("toOldDTOAll")
    @Override
    default List<OperatorOldDTO> toDTOAll(List<OperatorDTO> entities) {
        return Mapper.super.toDTOAll(entities);
    }
}
