package com.becon.opencelium.backend.mapper.connection;

import com.becon.opencelium.backend.database.mongodb.entity.ArgumentMng;
import com.becon.opencelium.backend.database.mongodb.entity.LinkedFieldMng;
import com.becon.opencelium.backend.resource.connection.aggregator.ArgumentDTO;
import com.becon.opencelium.backend.resource.connection.binding.LinkedFieldDTO;
import org.mapstruct.IterableMapping;
import org.mapstruct.Mapper;
import org.mapstruct.Named;

import java.util.List;

@Mapper(componentModel = "spring")
@Named("linkedFieldMapper")
public interface LinkedFieldMapper {
    @Named("toEntity")
    LinkedFieldMng toEntity(LinkedFieldDTO linkedFieldDTO);
    @Named("toDTO")
    LinkedFieldDTO toDTO(LinkedFieldMng linkedFieldMng);
    @Named("toEntityAll")
    @IterableMapping(qualifiedByName = "toEntity")
    List<LinkedFieldMng> toEntityAll(List<LinkedFieldDTO> linkedFieldDTOs);
    @Named("toDTOAll")
    @IterableMapping(qualifiedByName = "toDTO")
    List<LinkedFieldDTO> toDTOAll(List<LinkedFieldMng> linkedFieldMngs);
}
