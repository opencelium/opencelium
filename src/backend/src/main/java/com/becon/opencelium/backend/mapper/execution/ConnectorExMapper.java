package com.becon.opencelium.backend.mapper.execution;

import com.becon.opencelium.backend.database.mongodb.entity.ConnectorMng;
import com.becon.opencelium.backend.mapper.base.Mapper;
import com.becon.opencelium.backend.mapper.utils.HelperMapper;
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
                OperationMngMapper.class,
                HelperMapper.class
        }
)
@Named("connectorExMapper")
public interface ConnectorExMapper extends Mapper<ConnectorEx, ConnectorMng> {

    @Mapping(target = "methods", qualifiedByName = {"operationMngMapper", "toEntityAll"})
    @Mapping(target = "operators", qualifiedByName = {"operatorExMapper", "toEntityAll"})
    @Mapping(target = "requiredData", source = "connectorId", qualifiedByName = {"helperMapper", "getRequiredData"})
    @Named("toEntity")
    ConnectorEx toEntity(ConnectorMng dto);

    default ConnectorMng toDTO(ConnectorEx entity) {
        return null;
    }
}
