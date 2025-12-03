package com.becon.opencelium.backend.mapper.v5;

import com.becon.opencelium.backend.resource.connection.old.FieldBindingOldDTO;
import com.becon.opencelium.backend.resource.template.CtionTemplateResource;
import com.becon.opencelium.backend.resource.v5.connection.MapperDTO;
import com.becon.opencelium.backend.resource.v5.template.CtionTemplateV5Resource;
import com.fasterxml.jackson.core.type.TypeReference;
import com.fasterxml.jackson.databind.ObjectMapper;
import org.mapstruct.Mapper;
import org.mapstruct.Mapping;
import org.springframework.beans.factory.annotation.Autowired;

import java.util.ArrayList;
import java.util.List;

@Mapper(componentModel = "spring")
public abstract class ConnectionV5ResourceMapper {

    @Autowired
    protected FchartTemplateResourceMapper fchartTemplateResourceMapper;

    @Autowired
    protected MapperMapper mapperMapper;

    protected final ObjectMapper objectMapper = new ObjectMapper();

    @Mapping(target = "executionPlan", ignore = true)
    @Mapping(target = "mappers", expression = "java(buildMappers(connection.getFieldBinding()))")
    @Mapping(target = "id", source = "nodeId")
    @Mapping(target = "flowcharts", expression = "java(fchartTemplateResourceMapper.toDTO(connection.getFromConnector(), connection.getToConnector()))")
    abstract CtionTemplateV5Resource toV5(CtionTemplateResource connection);

    protected Object buildMappers(Object fbs) {
        if (fbs == null) return null;
        List<FieldBindingOldDTO> fieldBindings = objectMapper.convertValue(fbs, new TypeReference<>() {
        });

        ArrayList<MapperDTO> mappers = new ArrayList<>();
        for (FieldBindingOldDTO fb : fieldBindings) {
            MapperDTO mapperDTO = mapperMapper.fromFb(fb);
            mappers.add(mapperDTO);
        }

        return mappers;
    }
}
