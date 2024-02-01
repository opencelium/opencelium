package com.becon.opencelium.backend.mapper.others;

import com.becon.opencelium.backend.mapper.base.Mapper;
import com.becon.opencelium.backend.resource.connection.binding.EnhancementDTO;
import com.becon.opencelium.backend.resource.connection.binding.EnhancementOldDTO;
import org.mapstruct.*;

@org.mapstruct.Mapper(
        componentModel = "spring",
        unmappedTargetPolicy = ReportingPolicy.IGNORE,
        unmappedSourcePolicy = ReportingPolicy.IGNORE
)
@Named("enhancementOldDTOMapper")
public interface EnhancementOldDTOMapper extends Mapper<EnhancementDTO, EnhancementOldDTO> {
    @Named("toDTO")
    @Mappings({
            @Mapping(target = "title", source = "name"),
            @Mapping(target = "script", source = "expertCode"),
            @Mapping(target = "args", source = "expertVar"),
    })
    EnhancementDTO toEntity(EnhancementOldDTO dto);

    @Named("toOldDTO")
    @InheritInverseConfiguration
    EnhancementOldDTO toDTO(EnhancementDTO entity);
}
