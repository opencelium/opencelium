package com.becon.opencelium.backend.mapper.execution;

import com.becon.opencelium.backend.database.mongodb.entity.ConnectionMng;
import com.becon.opencelium.backend.mapper.base.Mapper;
import com.becon.opencelium.backend.resource.execution.ConnectionEx;
import org.mapstruct.Mapping;
import org.mapstruct.Mappings;
import org.mapstruct.ReportingPolicy;

@org.mapstruct.Mapper(
        componentModel = "spring",
        unmappedTargetPolicy = ReportingPolicy.IGNORE,
        unmappedSourcePolicy = ReportingPolicy.IGNORE,
        uses = {
                ConnectorExMapper.class,
                FieldBindExMapper.class
        }
)
public interface ConnectionExMapper extends Mapper<ConnectionEx, ConnectionMng> {
    @Mappings({
            @Mapping(target = "source", source = "fromConnector", qualifiedByName = {"connectorExMapper", "toEntity"}),
            @Mapping(target = "target", source = "toConnector", qualifiedByName = {"connectorExMapper", "toEntity"}),
            @Mapping(target = "fieldBind", source = "fieldBindings", qualifiedByName = {"fieldBindExMapper", "toEntityAll"}),
    })
    ConnectionEx toEntity(ConnectionMng dto);

    default ConnectionMng toDTO(ConnectionEx entity) {
        return null;
    }

}
