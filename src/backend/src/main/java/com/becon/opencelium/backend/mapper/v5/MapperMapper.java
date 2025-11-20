package com.becon.opencelium.backend.mapper.v5;

import com.becon.opencelium.backend.database.mongodb.entity.MapperMng;
import com.becon.opencelium.backend.resource.connection.v5.MapperDTO;
import org.mapstruct.Mapper;
import org.mapstruct.Named;

import java.util.List;

@Named("mapperMapper")
@Mapper(componentModel = "spring")
public interface MapperMapper {

    @Named("toDTO")
    MapperDTO toDTO(MapperMng mapper);

    @Named("toDTOAll")
    default List<MapperDTO> toDTOAll(List<MapperMng> mapper){
        if (mapper == null) {
            return null;
        }

        return mapper.stream().map(this::toDTO).toList();
    }
}
