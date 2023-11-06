package com.becon.opencelium.backend.mapper.mongo;

import com.becon.opencelium.backend.database.mongodb.entity.OperatorMng;
import com.becon.opencelium.backend.mapper.base.Mapper;
import com.becon.opencelium.backend.resource.connection.OperatorDTO;
import org.mapstruct.Mapping;
import org.mapstruct.Mappings;
import org.mapstruct.Named;

import java.util.List;


@org.mapstruct.Mapper(
        componentModel = "spring",
        uses = ConditionMngMapper.class
)
@Named("operatorMngMapper")
public interface OperatorMngMapper extends Mapper<OperatorMng, OperatorDTO> {
    @Named("toEntity")
    @Mappings({
            @Mapping(target = "id", source = "nodeId"),
            @Mapping(target = "condition", qualifiedByName ={"conditionMngMapper", "toEntity"})
    })
    OperatorMng toEntity(OperatorDTO operatorDTO);

    @Named("toDTO")
    @Mappings({
            @Mapping(target = "nodeId", source = "id"),
            @Mapping(target = "condition", qualifiedByName ={"conditionMngMapper", "toDTO"})
    })
    OperatorDTO toDTO(OperatorMng operatorMng);

    @Named("toEntityAll")
    default List<OperatorMng> toEntityAll(List<OperatorDTO> dtos) {
        return Mapper.super.toEntityAll(dtos);
    }

    @Named("toDTOAll")
    default List<OperatorDTO> toDTOAll(List<OperatorMng> entities) {
        return Mapper.super.toDTOAll(entities);
    }
}
