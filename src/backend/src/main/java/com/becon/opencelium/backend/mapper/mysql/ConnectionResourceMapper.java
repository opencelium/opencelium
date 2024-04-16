package com.becon.opencelium.backend.mapper.mysql;

import com.becon.opencelium.backend.database.mysql.entity.Connection;
import com.becon.opencelium.backend.mapper.base.Mapper;
import com.becon.opencelium.backend.mapper.utils.HelperMapper;
import com.becon.opencelium.backend.resource.connection.ConnectionResource;
import com.becon.opencelium.backend.utility.StringUtility;
import org.mapstruct.Mapping;
import org.mapstruct.Mappings;
import org.mapstruct.ReportingPolicy;


@org.mapstruct.Mapper(
        componentModel = "spring",
        unmappedTargetPolicy = ReportingPolicy.IGNORE,
        unmappedSourcePolicy = ReportingPolicy.IGNORE,
        uses = {
                EnhancementMapper.class,
                HelperMapper.class
        },
        imports = {
                StringUtility.class
        }
)
public interface ConnectionResourceMapper extends Mapper<Connection, ConnectionResource> {
    @Override
    @Mappings({
            @Mapping(target = "fromConnector", source = "fromConnector.connectorId"),
            @Mapping(target = "toConnector", source = "toConnector.connectorId"),
            @Mapping(target = "icon", expression = "java(StringUtility.findImageFromUrl(dto.getIcon()))"),
            @Mapping(target = "enhancements",qualifiedByName = {"enhancementMapper", "toEntityAll"})
    })
    Connection toEntity(ConnectionResource dto);

    @Override
    @Mappings({
            @Mapping(target = "fromConnector", qualifiedByName = {"helperMapper","getConnectorResourceById"}),
            @Mapping(target = "toConnector", qualifiedByName = {"helperMapper","getConnectorResourceById"}),
            @Mapping(target = "icon", expression = "java(StringUtility.resolveImagePath(entity.getIcon()))"),
            @Mapping(target = "enhancements", qualifiedByName = {"enhancementMapper", "toDTOAll"})
    })
    ConnectionResource toDTO(Connection entity);

}
