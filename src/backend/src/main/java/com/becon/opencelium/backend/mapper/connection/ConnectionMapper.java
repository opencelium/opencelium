package com.becon.opencelium.backend.mapper.connection;

import com.becon.opencelium.backend.database.mongodb.entity.ConnectionMng;
import com.becon.opencelium.backend.database.mysql.entity.Connection;
import com.becon.opencelium.backend.resource.connection.ConnectionDTO;
import org.mapstruct.*;

import java.util.List;

@Mapper(
        componentModel = "spring",
        unmappedSourcePolicy = ReportingPolicy.IGNORE,
        unmappedTargetPolicy = ReportingPolicy.IGNORE,
        uses = {
                DataAggregatorMapper.class,
                ConnectorMapper.class,
                FieldBindingMapper.class
        }
)
@Named("connectorMapper")
public abstract class ConnectionMapper {

    @Named("toEntity")
    @Mappings({
            @Mapping(target = "id", source = "nodeId"),
            @Mapping(target = "toConnector", qualifiedByName = {"connectorMapper", "toEntity"}),
            @Mapping(target = "fromConnector", qualifiedByName = {"connectorMapper", "toEntity"}),
            @Mapping(target = "fieldBinding", qualifiedByName = {"fieldBindingMapper", "toEntityAll"}),
            @Mapping(target = "dataAggregator", qualifiedByName = {"dataAggregatorMapper", "toEntity"})
    })
    public abstract ConnectionMng toEntity(ConnectionDTO connectorDTO);
    @Named("toDTO")
    @Mappings({
            @Mapping(target = "nodeId", source = "id"),
            @Mapping(target = "toConnector", qualifiedByName = {"connectorMapper", "toDTO"}),
            @Mapping(target = "fromConnector", qualifiedByName = {"connectorMapper", "toDTO"}),
            @Mapping(target = "fieldBinding", qualifiedByName = {"fieldBindingMapper", "toDTOAll"}),
            @Mapping(target = "dataAggregator", qualifiedByName = {"dataAggregatorMapper", "toDTO"})
    })
    public abstract ConnectionDTO toDTO(ConnectionMng connectorMng);

    @IterableMapping(qualifiedByName = "toDTO")
    public abstract List<ConnectionDTO> toDTOAll(List<ConnectionMng> connectionMngs);

    @Mapping(target = "id", source = "connectionId")
    @Mapping(target = "name", source = "title")
    @Mapping(target = "toConnector", expression = "java(connectionMng.getToConnector().getConnectorId())")
    @Mapping(target = "fromConnector", expression = "java(connectionMng.getFromConnector().getConnectorId())")
    public abstract Connection toEntity(ConnectionMng connectionMng);
}
