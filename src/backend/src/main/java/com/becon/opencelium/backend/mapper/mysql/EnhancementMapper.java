package com.becon.opencelium.backend.mapper.mysql;

import com.becon.opencelium.backend.database.mysql.entity.Enhancement;
import com.becon.opencelium.backend.mapper.base.Mapper;
import com.becon.opencelium.backend.mapper.base.MapperUpdatable;
import com.becon.opencelium.backend.resource.connection.binding.EnhancementDTO;
import org.mapstruct.*;

import java.util.List;

@org.mapstruct.Mapper(
        componentModel = "spring",
        unmappedTargetPolicy = ReportingPolicy.IGNORE,
        unmappedSourcePolicy = ReportingPolicy.IGNORE
)
@Named("enhancementMapper")
public interface EnhancementMapper extends MapperUpdatable<Enhancement, EnhancementDTO> {
    @Named("toEntity")
    @Mappings({
            @Mapping(target = "simpleCode", expression = "java(\"\")"),
    })
    Enhancement toEntity(EnhancementDTO dto);

    @Named("toDTO")
    @Mappings({
            @Mapping(target = "simpleCode",ignore = true),
    })
    EnhancementDTO toDTO(Enhancement entity);

    @Override
    @Mapping(target = "simpleCode", ignore = true)
    void updateEntityFromDto(@MappingTarget Enhancement entity, EnhancementDTO dto);

    @Override
    @Mapping(target = "simpleCode", ignore = true)
    void updateDtoFromEntity(@MappingTarget EnhancementDTO dto, Enhancement entity);

    @Override
    @Named("toEntityAll")
    default List<Enhancement> toEntityAll(List<EnhancementDTO> dtos) {
        return MapperUpdatable.super.toEntityAll(dtos);
    }

    @Override
    @Named("toDTOAll")
    default List<EnhancementDTO> toDTOAll(List<Enhancement> entities) {
        return MapperUpdatable.super.toDTOAll(entities);
    }
}
