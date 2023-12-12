package com.becon.opencelium.backend.mapper.execution;

import com.becon.opencelium.backend.database.mongodb.entity.ConnectorMng;
import com.becon.opencelium.backend.mapper.base.Mapper;
import com.becon.opencelium.backend.resource.execution.ConnectorEx;
import org.mapstruct.Mapping;
import org.mapstruct.Named;
import org.mapstruct.ReportingPolicy;

@org.mapstruct.Mapper(
        componentModel = "spring",
        unmappedTargetPolicy = ReportingPolicy.IGNORE,
        unmappedSourcePolicy = ReportingPolicy.IGNORE,
        uses = {
                OperatorExMapper.class,
                OperationMngMapper.class
        }
)
@Named("connectorExMapper")
public interface ConnectorExMapper extends Mapper<ConnectorEx, ConnectorMng> {

    @Mapping(target = "methods", qualifiedByName = {"operationMngMapper","toEntityAll"})
    @Mapping(target = "operators", qualifiedByName = {"operatorExMapper","toEntityAll"})
    @Named("toEntity")
    ConnectorEx toEntity(ConnectorMng dto);

    default ConnectorMng toDTO(ConnectorEx entity){
        return null;
    }
}
