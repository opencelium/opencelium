package com.becon.opencelium.backend.mapper.others;

import com.becon.opencelium.backend.mapper.base.Mapper;
import com.becon.opencelium.backend.resource.connection.ConnectionDTO;
import com.becon.opencelium.backend.resource.template.CtionTemplateResource;
import org.mapstruct.Mapping;
import org.mapstruct.Mappings;
import org.mapstruct.ReportingPolicy;

@org.mapstruct.Mapper(
        componentModel = "spring",
        unmappedTargetPolicy = ReportingPolicy.IGNORE,
        unmappedSourcePolicy = ReportingPolicy.IGNORE,
        uses = {
                ConnectorDTOAndTemplateMapper.class
        }
)
public interface ConnectionDtoAndTemplateMapper
        extends Mapper<ConnectionDTO, CtionTemplateResource> {

    @Mappings({
            @Mapping(target = "nodeId", ignore = true),
            @Mapping(target = "fromConnector", qualifiedByName = {"ConnectorDTOAndTemplateMapper","toDTO"}),
            @Mapping(target = "toConnector", qualifiedByName = {"ConnectorDTOAndTemplateMapper","toDTO"})
    })
    CtionTemplateResource toDTO(ConnectionDTO entity);

    @Override
    default ConnectionDTO toEntity(CtionTemplateResource dto){
        return null;
    }
}
