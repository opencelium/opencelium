package com.becon.opencelium.backend.mapper.mongo;

import com.becon.opencelium.backend.database.mongodb.entity.ConditionMng;
import com.becon.opencelium.backend.mapper.base.Mapper;
import com.becon.opencelium.backend.resource.connection.ConditionDTO;
import org.mapstruct.Mapping;
import org.mapstruct.Mappings;
import org.mapstruct.Named;
import org.mapstruct.ReportingPolicy;

@org.mapstruct.Mapper(
        componentModel = "spring",
        uses = StatementMngMapper.class,
        unmappedTargetPolicy = ReportingPolicy.IGNORE,
        unmappedSourcePolicy = ReportingPolicy.IGNORE
)
@Named("conditionMngMapper")
public interface ConditionMngMapper extends Mapper<ConditionMng, ConditionDTO> {
    @Named("toDTO")
    @Mappings({
            @Mapping(target = "leftStatement", qualifiedByName = {"statementMngMapper","toDTO"}),
            @Mapping(target = "rightStatement", qualifiedByName = {"statementMngMapper","toDTO"})
    })
    ConditionDTO toDTO(ConditionMng conditionMng);

    @Named("toEntity")
    @Mappings({
            @Mapping(target = "leftStatement", qualifiedByName = {"statementMngMapper","toEntity"}),
            @Mapping(target = "rightStatement", qualifiedByName = {"statementMngMapper","toEntity"})
    })
    ConditionMng toEntity(ConditionDTO conditionDTO);
}
