package com.becon.opencelium.backend.mapper.mysql;

import com.becon.opencelium.backend.invoker.entity.Body;
import com.becon.opencelium.backend.mapper.base.Mapper;
import com.becon.opencelium.backend.resource.connector.BodyDTO;
import org.mapstruct.Named;

@org.mapstruct.Mapper(componentModel = "spring")
@Named("bodyMapper")
public interface BodyMapper extends Mapper<Body, BodyDTO> {
    @Named("toEntity")
    Body toEntity(BodyDTO bodyDTO);

    @Named("toDTO")
    BodyDTO toDTO(Body bodyMng);
}
