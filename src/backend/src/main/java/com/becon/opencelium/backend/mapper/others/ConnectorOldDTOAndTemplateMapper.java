package com.becon.opencelium.backend.mapper.others;

import com.becon.opencelium.backend.mapper.base.Mapper;
import com.becon.opencelium.backend.resource.connection.old.ConnectorOldDTO;
import com.becon.opencelium.backend.resource.template.CtorTemplateResource;
import com.becon.opencelium.backend.resource.template.InvokerTemplateResource;
import org.mapstruct.Mapping;
import org.mapstruct.Mappings;
import org.mapstruct.Named;
import org.mapstruct.ReportingPolicy;

@org.mapstruct.Mapper(
        componentModel = "spring",
        unmappedTargetPolicy = ReportingPolicy.IGNORE,
        unmappedSourcePolicy = ReportingPolicy.IGNORE,
        imports = InvokerTemplateResource.class
)
@Named("ConnectorOldDTOAndTemplateMapper")
public interface ConnectorOldDTOAndTemplateMapper extends Mapper<ConnectorOldDTO, CtorTemplateResource> {
    @Named("toDTO")
    @Mappings({
            @Mapping(target = "nodeId", ignore = true),
            @Mapping(target = "invoker", expression = "java(new InvokerTemplateResource(entity.getInvoker().getName()))")
    })
    CtorTemplateResource toDTO(ConnectorOldDTO entity);

    @Override
    default ConnectorOldDTO toEntity(CtorTemplateResource dto){
        return null;
    }
}
