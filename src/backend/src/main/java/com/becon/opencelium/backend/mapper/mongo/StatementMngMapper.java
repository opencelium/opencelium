package com.becon.opencelium.backend.mapper.mongo;

import com.becon.opencelium.backend.database.mongodb.entity.StatementMng;
import com.becon.opencelium.backend.resource.connection.StatementDTO;
import com.becon.opencelium.backend.mapper.base.Mapper;
import org.mapstruct.Named;

@org.mapstruct.Mapper(componentModel = "spring")
@Named("statementMngMapper")
public interface StatementMngMapper extends Mapper<StatementMng, StatementDTO>{
    @Named("toEntity")
    StatementMng toEntity(StatementDTO statementDTO);
    @Named("toDTO")
    StatementDTO toDTO(StatementMng statementMng);
}
