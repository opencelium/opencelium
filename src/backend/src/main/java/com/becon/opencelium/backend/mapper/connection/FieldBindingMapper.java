package com.becon.opencelium.backend.mapper.connection;

import com.becon.opencelium.backend.database.mongodb.entity.FieldBindingMng;
import com.becon.opencelium.backend.resource.connection.binding.FieldBindingDTO;
import org.mapstruct.*;

import java.util.List;

@Mapper(
        componentModel = "spring",
        uses = {
                LinkedFieldMapper.class, EnhancementMapper.class
        }
)
@Named("fieldBindingMapper")
public interface FieldBindingMapper {
    @Named("toEntity")
    @Mappings({
            @Mapping(target = "to", qualifiedByName ={"linkedFieldMapper", "toEntityAll"}),
            @Mapping(target = "from", qualifiedByName ={"linkedFieldMapper", "toEntityAll"}),
            @Mapping(target = "enhancement", qualifiedByName ={"enhancementMapper", "toEntity"})
    })
    FieldBindingMng toEntity(FieldBindingDTO fieldBindingDTO);
    @Named("toDTO")
    @Mappings({
            @Mapping(target = "to", qualifiedByName ={"linkedFieldMapper", "toDTOAll"}),
            @Mapping(target = "from", qualifiedByName ={"linkedFieldMapper", "toDTOAll"}),
            @Mapping(target = "enhancement", qualifiedByName ={"enhancementMapper", "toDTO"})
    })
    FieldBindingDTO toDTO(FieldBindingMng fieldBindingMng);

    @Named("toEntityAll")
    @IterableMapping(qualifiedByName = "toEntity")
    List<FieldBindingMng> toEntityAll(List<FieldBindingDTO> fieldBindingDTOs);

    @Named("toDTOAll")
    @IterableMapping(qualifiedByName = "toDTO")
    List<FieldBindingDTO> toDTOAll(List<FieldBindingMng> fieldBindingMngs);
}
