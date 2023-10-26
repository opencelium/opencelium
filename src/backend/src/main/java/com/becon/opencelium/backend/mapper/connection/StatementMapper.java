package com.becon.opencelium.backend.mapper.connection;

import com.becon.opencelium.backend.database.mongodb.entity.StatementMng;
import com.becon.opencelium.backend.resource.connection.StatementDTO;
import org.mapstruct.Mapper;
import org.mapstruct.Named;

@Mapper(componentModel = "spring")
@Named("statementMapper")
public interface StatementMapper {
    @Named("toEntity")
    StatementMng toEntity(StatementDTO statementDTO);
    @Named("toDTO")
    StatementDTO toDTO(StatementMng statementMng);
}
