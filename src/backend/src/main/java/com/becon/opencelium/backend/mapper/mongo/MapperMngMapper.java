package com.becon.opencelium.backend.mapper.mongo;

import com.becon.opencelium.backend.database.mongodb.entity.MapperMng;
import com.becon.opencelium.backend.mapper.base.Mapper;
import com.becon.opencelium.backend.resource.v5.connection.MapperDTO;
import org.mapstruct.Named;
import org.mapstruct.ReportingPolicy;

import java.util.List;

@org.mapstruct.Mapper(
        componentModel = "spring",
        unmappedTargetPolicy = ReportingPolicy.IGNORE
)
@Named("mapperMngMapper")
public interface MapperMngMapper extends Mapper<MapperMng, MapperDTO>{

    MapperMng toEntity(MapperDTO dto);

    MapperDTO toDTO(MapperMng entity);

    @Named("toEntityAll")
    default List<MapperMng> toEntityAll(List<MapperDTO> dtos) {
        return Mapper.super.toEntityAll(dtos);
    }

    @Named("toDTOAll")
    default List<MapperDTO> toDTOAll(List<MapperMng> entities) {
        return Mapper.super.toDTOAll(entities);
    }
}
