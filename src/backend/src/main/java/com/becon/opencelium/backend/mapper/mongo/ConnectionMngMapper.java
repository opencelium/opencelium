package com.becon.opencelium.backend.mapper.mongo;

import com.becon.opencelium.backend.database.mongodb.entity.ConnectionMng;
import com.becon.opencelium.backend.mapper.base.Mapper;
import com.becon.opencelium.backend.resource.connection.ConnectionDTO;
import org.mapstruct.Mapping;
import org.mapstruct.Mappings;
import org.mapstruct.Named;
import org.mapstruct.ReportingPolicy;

@org.mapstruct.Mapper(
        componentModel = "spring",
        unmappedSourcePolicy = ReportingPolicy.IGNORE,
        unmappedTargetPolicy = ReportingPolicy.IGNORE,
        uses = {
                ConnectorMngMapper.class
        }
)
@Named("connectionMngMapper")
public interface ConnectionMngMapper extends Mapper<ConnectionMng,ConnectionDTO> {
    @Named("toEntity")
    @Mappings({
            @Mapping(target = "id", source = "nodeId"),
            @Mapping(target = "toConnector", qualifiedByName = {"connectorMngMapper", "toEntity"}),
            @Mapping(target = "fromConnector", qualifiedByName = {"connectorMngMapper", "toEntity"})
    })
    ConnectionMng toEntity(ConnectionDTO connectorDTO);

    @Named("toDTO")
    @Mappings({
            @Mapping(target = "nodeId", source = "id"),
            @Mapping(target = "toConnector", qualifiedByName = {"connectorMngMapper", "toDTO"}),
            @Mapping(target = "fromConnector", qualifiedByName = {"connectorMngMapper", "toDTO"})
    })
    ConnectionDTO toDTO(ConnectionMng connectorMng);
}
