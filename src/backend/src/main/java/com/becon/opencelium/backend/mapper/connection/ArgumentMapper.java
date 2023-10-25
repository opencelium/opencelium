package com.becon.opencelium.backend.mapper.connection;

import com.becon.opencelium.backend.database.mongodb.entity.ArgumentMng;
import com.becon.opencelium.backend.resource.connection.aggregator.ArgumentDTO;
import org.mapstruct.IterableMapping;
import org.mapstruct.Mapper;
import org.mapstruct.Named;

import java.util.Set;

@Mapper(componentModel = "spring")
@Named("argumentMapper")
public interface ArgumentMapper {
    @Named("toEntity")
    ArgumentMng toEntity(ArgumentDTO argumentDTO);
    @Named("toDTO")
    ArgumentDTO toDTO(ArgumentMng argumentMng);
    @Named("toEntityAll")
    @IterableMapping(qualifiedByName = "toEntity")
    Set<ArgumentMng> toEntityAll(Set<ArgumentDTO> argumentDTOs);
    @Named("toDTOAll")
    @IterableMapping(qualifiedByName = "toDTO")
    Set<ArgumentDTO> toDTOAll(Set<ArgumentMng> argumentMngs);
}
