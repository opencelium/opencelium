package com.becon.opencelium.backend.mapper.connection;

import com.becon.opencelium.backend.database.mongodb.entity.OperatorMng;
import com.becon.opencelium.backend.resource.connection.OperatorDTO;
import org.mapstruct.*;

import java.util.List;

@Mapper(
        componentModel = "spring",
        uses = ConditionMapper.class
)
@Named("operatorMapper")
public interface OperatorMapper {
    @Named("toEntity")
    @Mappings({
            @Mapping(target = "id", source = "nodeId"),
            @Mapping(target = "condition", qualifiedByName ={"conditionMapper", "toEntity"})
    })
    OperatorMng toEntity(OperatorDTO operatorDTO);
    @Named("toDTO")
    @Mappings({
            @Mapping(target = "nodeId", source = "id"),
            @Mapping(target = "condition", qualifiedByName ={"conditionMapper", "toDTO"})
    })
    OperatorDTO toDTO(OperatorMng operatorMng);

    @Named("toEntityAll")
    @IterableMapping(qualifiedByName = "toEntity")
    List<OperatorMng> toEntityAll(List<OperatorDTO> operatorDTOs);

    @Named("toDTOAll")
    @IterableMapping(qualifiedByName = "toDTO")
    List<OperatorDTO> toDTOAll(List<OperatorMng> operatorMngs);
}
