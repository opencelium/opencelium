package com.becon.opencelium.backend.mapper.mysql;

import com.becon.opencelium.backend.database.mysql.entity.BusinessLayout;
import com.becon.opencelium.backend.database.mysql.entity.Connection;
import com.becon.opencelium.backend.database.mysql.entity.Enhancement;
import com.becon.opencelium.backend.mapper.base.Mapper;
import com.becon.opencelium.backend.mapper.utils.HelperMapper;
import com.becon.opencelium.backend.resource.connection.ConnectionDTO;
import com.becon.opencelium.backend.resource.connection.binding.EnhancementDTO;
import com.becon.opencelium.backend.utility.StringUtility;
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
        imports = {
                BusinessLayout.class,
                StringUtility.class,
                Enhancement.class
        }
)
public interface ConnectionMapper extends Mapper<Connection, ConnectionDTO> {
    @Override
    @Mappings({
            @Mapping(target = "id", source = "connectionId"),
            @Mapping(target = "fromConnector", source = "fromConnector.connectorId"),
            @Mapping(target = "toConnector", source = "toConnector.connectorId"),
            @Mapping(target = "icon", expression = "java(StringUtility.findImageFromUrl(dto.getIcon()))"),
            @Mapping(target = "enhancements",
                    expression = "java((dto.getFieldBinding() != null) ? dto.getFieldBinding().stream().map(e -> {Enhancement enh = enhancementMapper.toEntity(e.getEnhancement()); if(enh == null) enh = new Enhancement(); enh.setId(e.getEnhancementId()); return enh;}).toList() : null)"),
            @Mapping(target = "businessLayout",
                    expression = "java((dto.getBusinessLayout() != null) ? new BusinessLayout(dto.getBusinessLayout(), connection) : null)")
    })
    Connection toEntity(ConnectionDTO dto);

    @Override
    @Mappings({
            @Mapping(target = "connectionId", source = "id"),
            @Mapping(target = "fromConnector", qualifiedByName = {"helperMapper","getConnectorDTOById"}),
            @Mapping(target = "toConnector", qualifiedByName = {"helperMapper","getConnectorDTOById"}),
            @Mapping(target = "icon", expression = "java(StringUtility.resolveImagePath(entity.getIcon()))"),
            @Mapping(target = "fieldBinding", source = "enhancements", qualifiedByName = {"helperMapper", "getFieldBindings"}),
            @Mapping(target = "businessLayout", ignore = true)
    })
    ConnectionDTO toDTO(Connection entity);

    //don't use this anywhere!!!. This method wrote for force injecting of EnhancementMapper
    @IterableMapping(qualifiedByName = {"enhancementMapper", "toEntity"})
    List<Enhancement> toEnhancementAll(List<EnhancementDTO> dtos);

}
