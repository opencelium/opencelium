package com.becon.opencelium.backend.mapper.mysql;

import com.becon.opencelium.backend.database.mysql.entity.BusinessLayout;
import com.becon.opencelium.backend.database.mysql.entity.Connection;
import com.becon.opencelium.backend.mapper.base.Mapper;
import com.becon.opencelium.backend.mapper.mongo.FieldBindingMngMapper;
import com.becon.opencelium.backend.mapper.utils.HelperMapper;
import com.becon.opencelium.backend.resource.connection.ConnectionDTO;
import com.becon.opencelium.backend.utility.StringUtility;
import org.mapstruct.*;

@org.mapstruct.Mapper(
        componentModel = "spring",
        unmappedTargetPolicy = ReportingPolicy.IGNORE,
        unmappedSourcePolicy = ReportingPolicy.IGNORE,
        uses = {
                FieldBindingMngMapper.class,
                HelperMapper.class
        },
        imports = {
                BusinessLayout.class,
                StringUtility.class
        }
)
public interface ConnectionMapper extends Mapper<Connection, ConnectionDTO> {
    @Override
    @Mappings({
            @Mapping(target = "id", source = "connectionId"),
            @Mapping(target = "fromConnector", source = "fromConnector.connectorId"),
            @Mapping(target = "toConnector", source = "toConnector.connectorId"),
            @Mapping(target = "icon", expression = "java(StringUtility.findImageFromUrl(dto.getIcon()))"),
            @Mapping(target = "businessLayout",
                    expression = "java((dto.getBusinessLayout() != null) ? new BusinessLayout(dto.getBusinessLayout(), connection) : null)")
    })
    Connection toEntity(ConnectionDTO dto);

    @Override
    @Mappings({
            @Mapping(target = "id", ignore = true),
            @Mapping(target = "connectionId", source = "id"),
            @Mapping(target = "fromConnector", qualifiedByName = {"helperMapper", "getConnectorDTOById"}),
            @Mapping(target = "toConnector", qualifiedByName = {"helperMapper", "getConnectorDTOById"}),
            @Mapping(target = "icon", expression = "java(StringUtility.resolveImagePath(entity.getIcon()))"),
            @Mapping(target = "businessLayout", ignore = true)
    })
    ConnectionDTO toDTO(Connection entity);

}
