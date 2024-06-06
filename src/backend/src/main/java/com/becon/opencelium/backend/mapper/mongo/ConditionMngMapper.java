package com.becon.opencelium.backend.mapper.mongo;

import com.becon.opencelium.backend.database.mongodb.entity.ConditionMng;
import com.becon.opencelium.backend.mapper.base.Mapper;
import com.becon.opencelium.backend.resource.connection.ConditionDTO;
import com.becon.opencelium.backend.resource.connection.StatementDTO;
import org.mapstruct.*;

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
            @Mapping(target = "leftStatement", qualifiedByName = {"statementMngMapper", "toDTO"}),
            @Mapping(target = "rightStatement", qualifiedByName = {"statementMngMapper", "toDTO"})
    })
    ConditionDTO toDTO(ConditionMng conditionMng);

    @Named("toEntity")
    @Mappings({
            @Mapping(target = "leftStatement", qualifiedByName = {"statementMngMapper", "toEntity"}),
            @Mapping(target = "rightStatement", qualifiedByName = {"statementMngMapper", "toEntity"})
    })
    ConditionMng toEntity(ConditionDTO conditionDTO);

    @BeforeMapping
    default void preToEntity(@MappingTarget ConditionMng conditionMng, ConditionDTO conditionDTO) {
        if (conditionDTO.getRelationalOperator().equals("!=") && conditionDTO.getRightStatement() == null) {
            StatementDTO right = new StatementDTO();
            right.setColor("");
            right.setField("");
            right.setType("");
            right.setRightPropertyValue("");
            conditionDTO.setRightStatement(right);
        }
    }
}
