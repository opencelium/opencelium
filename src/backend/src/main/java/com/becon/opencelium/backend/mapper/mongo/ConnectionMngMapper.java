package com.becon.opencelium.backend.mapper.mongo;

import com.becon.opencelium.backend.database.mongodb.entity.ConnectionMng;
import com.becon.opencelium.backend.mapper.base.Mapper;
import com.becon.opencelium.backend.resource.connection.ConnectionDTO;
import com.becon.opencelium.backend.resource.connection.ConnectionVersionUpdateRequest;
import org.mapstruct.*;

@org.mapstruct.Mapper(
        componentModel = "spring",
        unmappedSourcePolicy = ReportingPolicy.IGNORE,
        unmappedTargetPolicy = ReportingPolicy.IGNORE,
        uses = {
                ConnectorMngMapper.class,
                FieldBindingMngMapper.class
        }
)
@Named("connectionMngMapper")
public interface ConnectionMngMapper extends Mapper<ConnectionMng, ConnectionDTO> {
    @Named("toEntity")
    @Mappings({
            @Mapping(target = "toConnector", qualifiedByName = {"connectorMngMapper", "toEntity"}),
            @Mapping(target = "fromConnector", qualifiedByName = {"connectorMngMapper", "toEntity"}),
            @Mapping(target = "fieldBindings", source = "fieldBinding", qualifiedByName = {"fieldBindingMngMapper", "toEntityAll"}),
            @Mapping(target = "connectionId", ignore = true)
    })
    ConnectionMng toEntity(ConnectionDTO connectorDTO);

    @Named("toDTO")
    @Mappings({
            @Mapping(target = "toConnector", qualifiedByName = {"connectorMngMapper", "toDTO"}),
            @Mapping(target = "fromConnector", qualifiedByName = {"connectorMngMapper", "toDTO"}),
            @Mapping(target = "fieldBinding", source = "fieldBindings", qualifiedByName = {"fieldBindingMngMapper", "toDTOAll"})
    })
    ConnectionDTO toDTO(ConnectionMng connectorMng);

    void updateFrom(@MappingTarget ConnectionMng connectionMng, ConnectionVersionUpdateRequest request);
}
