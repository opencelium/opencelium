package com.becon.opencelium.backend.mapper.others;

import com.becon.opencelium.backend.mapper.base.Mapper;
import com.becon.opencelium.backend.resource.connection.binding.FieldBindingDTO;
import com.becon.opencelium.backend.resource.connection.old.FieldBindingOldDTO;
import org.mapstruct.*;

import java.util.List;

@org.mapstruct.Mapper(
        componentModel = "spring",
        unmappedTargetPolicy = ReportingPolicy.IGNORE,
        unmappedSourcePolicy = ReportingPolicy.IGNORE,
        uses = EnhancementOldDTOMapper.class
)
@Named("fieldBindingOldDTOMapper")
public interface FieldBindingOldDTOMapper extends Mapper<FieldBindingDTO, FieldBindingOldDTO> {
    @Named("toDTO")
    @Mapping(target = "id", source = "nodeId")
    @Mapping(target = "enhancement", qualifiedByName = {"enhancementOldDTOMapper", "toDTO"})
    FieldBindingDTO toEntity(FieldBindingOldDTO dto);
    @Named("toOldDTO")
    @Mapping(target = "nodeId", source = "id")
    @Mapping(target = "enhancement", qualifiedByName = {"enhancementOldDTOMapper", "toOldDTO"})
    FieldBindingOldDTO toDTO(FieldBindingDTO entity);
    @AfterMapping
    default void afterMappingToOld(FieldBindingOldDTO old, @MappingTarget FieldBindingDTO fb){
        fb.setEnhancementId(old.getEnhancement().getEnhanceId());
    }
    @AfterMapping
    default void afterMappingToNew(FieldBindingDTO fb, @MappingTarget FieldBindingOldDTO old){
        old.getEnhancement().setEnhanceId(fb.getEnhancementId());
    }
    @Override
    @Named("toDTOAll")
    default List<FieldBindingDTO> toEntityAll(List<FieldBindingOldDTO> dtos) {
        return Mapper.super.toEntityAll(dtos);
    }
    @Override
    @Named("toOldDTOAll")
    default List<FieldBindingOldDTO> toDTOAll(List<FieldBindingDTO> entities) {
        return Mapper.super.toDTOAll(entities);
    }
}
