package com.becon.opencelium.backend.mapper.mysql;

import com.becon.opencelium.backend.database.mysql.entity.BusinessLayout;
import com.becon.opencelium.backend.database.mysql.entity.Connection;
import com.becon.opencelium.backend.database.mysql.entity.Enhancement;
import com.becon.opencelium.backend.mapper.base.Mapper;
import com.becon.opencelium.backend.mapper.utils.HelperMapper;
import com.becon.opencelium.backend.resource.connection.ConnectionDTO;
import com.becon.opencelium.backend.resource.connection.binding.EnhancementDTO;
import org.mapstruct.*;

import java.util.List;


@org.mapstruct.Mapper(
        componentModel = "spring",
        unmappedTargetPolicy = ReportingPolicy.IGNORE,
        unmappedSourcePolicy = ReportingPolicy.IGNORE,
        uses = {
                EnhancementMapper.class,
                HelperMapper.class
        },
        imports = BusinessLayout.class
)
public interface ConnectionMapper extends Mapper<Connection, ConnectionDTO> {
    @Override
    @Mappings({
            @Mapping(target = "id", source = "connectionId"),
            @Mapping(target = "name", source = "title"),
            @Mapping(target = "fromConnector", source = "fromConnector.connectorId"),
            @Mapping(target = "toConnector", source = "toConnector.connectorId"),
            @Mapping(target = "enhancements",
                    expression = "java((dto.getFieldBinding() != null) ? dto.getFieldBinding().stream().map(e->enhancementMapper.toEntity(e.getEnhancement())).toList() : null)"),
            @Mapping(target = "businessLayout",
                    expression = "java((dto.getBusinessLayout() != null) ? new BusinessLayout(dto.getBusinessLayout(), connection) : null)")
    })
    Connection toEntity(ConnectionDTO dto);

    @Override
    @Mappings({
            @Mapping(target = "connectionId", source = "id"),
            @Mapping(target = "title", source = "name"),
            @Mapping(target = "fromConnector", qualifiedByName = {"helperMapper","getConnectorDTOById"}),
            @Mapping(target = "toConnector", qualifiedByName = {"helperMapper","getConnectorDTOById"}),
            @Mapping(target = "businessLayout", ignore = true)
    })
    ConnectionDTO toDTO(Connection entity);

    //don't use this anywhere!!!. This method wrote for force injecting of EnhancementMapper
    @IterableMapping(qualifiedByName = {"enhancementMapper", "toEntity"})
    List<Enhancement> toEnhancementAll(List<EnhancementDTO> dtos);

}
