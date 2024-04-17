package com.becon.opencelium.backend.mapper.mongo;

import com.becon.opencelium.backend.database.mongodb.entity.BodyMng;
import com.becon.opencelium.backend.mapper.base.Mapper;
import com.becon.opencelium.backend.resource.connector.BodyDTO;
import org.mapstruct.Named;

@org.mapstruct.Mapper(componentModel = "spring")
@Named("bodyMngMapper")
public interface BodyMngMapper extends Mapper<BodyMng, BodyDTO> {
    @Named("toEntity")
    BodyMng toEntity(BodyDTO bodyDTO);

    @Named("toDTO")
    BodyDTO toDTO(BodyMng bodyMng);
}
