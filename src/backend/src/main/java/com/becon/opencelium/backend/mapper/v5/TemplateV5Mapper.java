package com.becon.opencelium.backend.mapper.v5;

import com.becon.opencelium.backend.resource.v5.template.TemplateV5;
import com.becon.opencelium.backend.template.entity.Template;
import org.mapstruct.Mapper;
import org.mapstruct.Mapping;
import org.springframework.beans.factory.annotation.Autowired;

@Mapper(componentModel = "spring")
public abstract class TemplateV5Mapper {

    @Autowired
    protected ConnectionV5ResourceMapper connectionV5ResourceMapper;

    @Mapping(target = "connection", expression = "java(connectionV5ResourceMapper.toV5(template.getConnection()))")
    public abstract TemplateV5 toTemplateV5(Template template);
}
