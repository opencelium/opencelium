package com.becon.opencelium.backend.mapper.mysql;

import com.becon.opencelium.backend.constant.PathConstant;
import com.becon.opencelium.backend.database.mysql.entity.Connector;
import com.becon.opencelium.backend.mapper.base.Mapper;
import com.becon.opencelium.backend.mapper.utils.HelperMapper;
import com.becon.opencelium.backend.mapper.utils.ImageUtils;
import com.becon.opencelium.backend.resource.connection.ConnectorDTO;
import com.becon.opencelium.backend.utility.StringUtility;
import org.mapstruct.Mapping;
import org.mapstruct.Mappings;
import org.mapstruct.Named;
import org.mapstruct.ReportingPolicy;
import org.springframework.web.servlet.support.ServletUriComponentsBuilder;

import java.net.URI;

@org.mapstruct.Mapper(
        componentModel = "spring",
        unmappedTargetPolicy = ReportingPolicy.IGNORE,
        unmappedSourcePolicy = ReportingPolicy.IGNORE,
        uses = {
                InvokerMapper.class,
                HelperMapper.class
        },
        imports = {
                StringUtility.class,
                ImageUtils.class
        }
)
@Named("connectorMapper")
public interface ConnectorMapper extends Mapper<Connector, ConnectorDTO> {
    @Override
    @Named("toEntity")
    @Mappings({
            @Mapping(target = "id", source = "connectorId"),
            @Mapping(target = "invoker", source = "invoker.name"),
            @Mapping(target = "icon", expression = "java(StringUtility.findImageFromUrl(dto.getIcon()))")
    })
    Connector toEntity(ConnectorDTO dto);

    @Override
    @Named("toDTO")
    @Mappings({
            @Mapping(target = "connectorId", source = "id"),
            @Mapping(target = "icon", expression = "java(ImageUtils.resolveImagePath(entity.getIcon()))"),
            @Mapping(target = "invoker", qualifiedByName = {"helperMapper", "getInvokerDTO"})
    })
    ConnectorDTO toDTO(Connector entity);
}
