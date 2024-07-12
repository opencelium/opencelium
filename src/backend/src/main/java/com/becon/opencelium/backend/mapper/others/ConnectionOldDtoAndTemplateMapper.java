package com.becon.opencelium.backend.mapper.others;

import com.becon.opencelium.backend.mapper.base.Mapper;
import com.becon.opencelium.backend.resource.connection.old.ConnectionOldDTO;
import com.becon.opencelium.backend.resource.template.CtionTemplateResource;
import org.mapstruct.Mapping;
import org.mapstruct.Mappings;
import org.mapstruct.ReportingPolicy;

@org.mapstruct.Mapper(
        componentModel = "spring",
        unmappedTargetPolicy = ReportingPolicy.IGNORE,
        unmappedSourcePolicy = ReportingPolicy.IGNORE,
        uses = {
                ConnectorOldDTOAndTemplateMapper.class
        }
)
public interface ConnectionOldDtoAndTemplateMapper
        extends Mapper<ConnectionOldDTO, CtionTemplateResource> {

    @Mappings({
            @Mapping(target = "nodeId", ignore = true),
            @Mapping(target = "fromConnector", qualifiedByName = {"ConnectorOldDTOAndTemplateMapper","toDTO"}),
            @Mapping(target = "toConnector", qualifiedByName = {"ConnectorOldDTOAndTemplateMapper","toDTO"})
    })
    CtionTemplateResource toDTO(ConnectionOldDTO entity);

    @Override
    default ConnectionOldDTO toEntity(CtionTemplateResource dto){
        return null;
    }
}
