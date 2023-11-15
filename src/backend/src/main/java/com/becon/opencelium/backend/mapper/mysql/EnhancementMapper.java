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
    @Named("toEntity")
    @Mappings({
            @Mapping(target = "simpleCode", expression = "java(\"\")"),
            @Mapping(target = "expertCode", source = "script"),
            @Mapping(target = "expertVar", source = "variables")
    })
    Enhancement toEntity(EnhancementDTO dto);

    @Named("toDTO")
    @Mappings({
            @Mapping(target = "simpleCode",ignore = true),
            @Mapping(target = "script", source = "expertCode"),
            @Mapping(target = "variables", source = "expertVar")
    })
    EnhancementDTO toDTO(Enhancement entity);
}
