package com.becon.opencelium.backend.mapper.others;

import com.becon.opencelium.backend.mapper.base.Mapper;
import com.becon.opencelium.backend.resource.connection.ConnectionDTO;
import com.becon.opencelium.backend.resource.connection.old.ConnectionOldDTO;
import org.mapstruct.Mapping;
import org.mapstruct.Mappings;
import org.mapstruct.Named;
import org.mapstruct.ReportingPolicy;

@org.mapstruct.Mapper(
        componentModel = "spring",
        unmappedTargetPolicy = ReportingPolicy.IGNORE,
        unmappedSourcePolicy = ReportingPolicy.IGNORE,
        uses = {
                FieldBindingOldDTOMapper.class,
                ConnectorOldDTOMapper.class
        }
)
@Named("connectionOldDTOMapper")
public interface ConnectionOldDTOMapper extends Mapper<ConnectionDTO, ConnectionOldDTO> {
    @Named("toDTO")
    @Mappings({
            @Mapping(target = "id", source = "nodeId"),
            @Mapping(target = "fieldBinding",qualifiedByName = {"fieldBindingOldDTOMapper", "toDTOAll"}),
            @Mapping(target = "fromConnector", qualifiedByName = {"connectorOldDTOMapper","toDTO"}),
            @Mapping(target = "toConnector", qualifiedByName = {"connectorOldDTOMapper","toDTO"})
    })
    ConnectionDTO toEntity(ConnectionOldDTO dto);

    @Named("toOldDTO")
    @Mappings({
            @Mapping(target = "nodeId", source = "id"),
            @Mapping(target = "fieldBinding", qualifiedByName = {"fieldBindingOldDTOMapper", "toOldDTOAll"}),
            @Mapping(target = "fromConnector", qualifiedByName = {"connectorOldDTOMapper","toOldDTO"}),
            @Mapping(target = "toConnector", qualifiedByName = {"connectorOldDTOMapper","toOldDTO"}),
    })
    ConnectionOldDTO toDTO(ConnectionDTO entity);
}
