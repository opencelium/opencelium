package com.becon.opencelium.backend.mapper.connection;

import com.becon.opencelium.backend.database.mongodb.entity.ConditionMng;
import com.becon.opencelium.backend.database.mongodb.entity.RequestMng;
import com.becon.opencelium.backend.database.mongodb.entity.StatementMng;
import com.becon.opencelium.backend.resource.connection.ConditionDTO;
import com.becon.opencelium.backend.resource.connection.StatementDTO;
import com.becon.opencelium.backend.resource.connector.RequestDTO;
import org.mapstruct.*;

@Mapper(
        componentModel = "spring",
        uses = StatementMapper.class,
        unmappedTargetPolicy = ReportingPolicy.IGNORE,
        unmappedSourcePolicy = ReportingPolicy.IGNORE
)
@Named("conditionMapper")
public interface ConditionMapper {
    @Named("toDTO")
    @Mappings({
            @Mapping(target = "leftStatement", qualifiedByName = {"statementMapper","toDTO"}),
            @Mapping(target = "rightStatement", qualifiedByName = {"statementMapper","toDTO"})
    })
    ConditionDTO toDTO(ConditionMng conditionMng);

    @Named("toEntity")
    @Mappings({
            @Mapping(target = "leftStatement", qualifiedByName = {"statementMapper","toEntity"}),
            @Mapping(target = "rightStatement", qualifiedByName = {"statementMapper","toEntity"})
    })
    ConditionMng toEntity(ConditionDTO conditionDTO);
}
