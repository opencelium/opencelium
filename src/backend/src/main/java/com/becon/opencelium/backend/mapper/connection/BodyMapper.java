package com.becon.opencelium.backend.mapper.connection;

import com.becon.opencelium.backend.database.mongodb.entity.BodyMng;
import com.becon.opencelium.backend.resource.connector.BodyDTO;
import org.mapstruct.Mapper;
import org.mapstruct.Named;

@Mapper(componentModel = "spring")
@Named("bodyMapper")
public interface BodyMapper {
    @Named("toEntity")
    BodyMng toEntity(BodyDTO bodyDTO);
    @Named("toDTO")
    BodyDTO toDTO(BodyMng bodyMng);
}
