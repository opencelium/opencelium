package com.becon.opencelium.backend.mapper.mongo;

import com.becon.opencelium.backend.database.mongodb.entity.FieldBindingMng;
import com.becon.opencelium.backend.mapper.base.Mapper;
import com.becon.opencelium.backend.mapper.utils.HelperMapper;
import com.becon.opencelium.backend.resource.connection.binding.FieldBindingDTO;
import org.mapstruct.Mapping;
import org.mapstruct.Mappings;
import org.mapstruct.Named;
import org.mapstruct.ReportingPolicy;

import java.util.List;

@org.mapstruct.Mapper(
        componentModel = "spring",
        unmappedTargetPolicy = ReportingPolicy.IGNORE,
        uses = {
                HelperMapper.class,
                LinkedFieldMngMapper.class,
                EnhancementMngMapper.class
        }
)
@Named("fieldBindingMngMapper")
public interface FieldBindingMngMapper extends Mapper<FieldBindingMng, FieldBindingDTO>{
    @Mappings({
            @Mapping(target = "enhancement", qualifiedByName = {"enhancementMngMapper","toEntity"}),
            @Mapping(target = "to", qualifiedByName = {"linkedFieldMngMapper", "toEntityAll"}),
            @Mapping(target = "from", qualifiedByName = {"linkedFieldMngMapper", "toEntityAll"})
    })
    FieldBindingMng toEntity(FieldBindingDTO dto);

    @Mappings({
            @Mapping(target = "to", qualifiedByName = {"linkedFieldMngMapper", "toDTOAll"}),
            @Mapping(target = "from", qualifiedByName = {"linkedFieldMngMapper", "toDTOAll"}),
            @Mapping(target = "enhancement", source = "enhancementId", qualifiedByName = {"helperMapper", "getEnhancementDTOById"})
    })
    FieldBindingDTO toDTO(FieldBindingMng entity);

    @Named("toEntityAll")
    default List<FieldBindingMng> toEntityAll(List<FieldBindingDTO> dtos) {
        return Mapper.super.toEntityAll(dtos);
    }
    @Named("toDTOAll")
    default List<FieldBindingDTO> toDTOAll(List<FieldBindingMng> entities) {
        return Mapper.super.toDTOAll(entities);
    }
}
