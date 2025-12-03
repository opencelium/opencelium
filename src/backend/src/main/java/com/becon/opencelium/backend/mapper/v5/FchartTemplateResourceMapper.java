package com.becon.opencelium.backend.mapper.v5;

import com.becon.opencelium.backend.resource.template.CtorTemplateResource;
import com.becon.opencelium.backend.resource.v5.template.FchartTemplateResource;
import org.mapstruct.Mapper;
import org.mapstruct.Mapping;

import java.util.Arrays;
import java.util.List;

@Mapper(componentModel = "spring")
public abstract class FchartTemplateResourceMapper {

    public List<FchartTemplateResource> toDTO(CtorTemplateResource from, CtorTemplateResource to) {
        FchartTemplateResource f1 = toDTO(from);
        FchartTemplateResource f2 = toDTO(to);

        return Arrays.asList(f1, f2);
    }

    @Mapping(target = "id", source = "nodeId")
    @Mapping(target = "flowId", ignore = true)
    public abstract FchartTemplateResource toDTO(CtorTemplateResource connector);
}
