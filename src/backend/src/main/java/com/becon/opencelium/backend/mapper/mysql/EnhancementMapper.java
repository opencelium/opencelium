package com.becon.opencelium.backend.mapper.mysql;

import com.becon.opencelium.backend.database.mysql.entity.Enhancement;
import com.becon.opencelium.backend.mapper.base.Mapper;
import com.becon.opencelium.backend.resource.connection.binding.EnhancementDTO;
import org.mapstruct.*;

@org.mapstruct.Mapper(
        componentModel = "spring",
        unmappedTargetPolicy = ReportingPolicy.IGNORE,
        unmappedSourcePolicy = ReportingPolicy.IGNORE
)
@Named("enhancementMapper")
public interface EnhancementMapper extends Mapper<Enhancement, EnhancementDTO> {
    @Override
    @Named("toEntity")
    @Mappings({
            @Mapping(target = "id", source = "enhanceId"),
            @Mapping(target = "simpleCode", expression = "java(\"\")"),
    })
    Enhancement toEntity(EnhancementDTO dto);

    @Override
    @Named("toDTO")
    @Mappings({
            @Mapping(target = "enhanceId", source = "id"),
            @Mapping(target = "simpleCode",ignore = true),
    })
    EnhancementDTO toDTO(Enhancement entity);
}
