package com.becon.opencelium.backend.mapper.connection;

import com.becon.opencelium.backend.database.mongodb.entity.DataAggregatorMng;
import com.becon.opencelium.backend.resource.connection.aggregator.DataAggregatorDTO;
import org.mapstruct.Mapper;
import org.mapstruct.Mapping;
import org.mapstruct.Named;

@Mapper(
        componentModel = "spring",
        uses = ArgumentMapper.class
)
@Named("dataAggregatorMapper")
public interface DataAggregatorMapper {
    @Named("toDTO")
    @Mapping(target = "args", qualifiedByName = {"argumentMapper","toDTOAll"})
    DataAggregatorDTO toDTO(DataAggregatorMng dataAggregatorMng);

    @Named("toEntity")
    @Mapping(target = "args", qualifiedByName = {"argumentMapper","toEntityAll"})
    DataAggregatorMng toEntity(DataAggregatorDTO dataAggregatorDTO);
}
