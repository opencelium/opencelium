package com.becon.opencelium.backend.mapper.execution;

import com.becon.opencelium.backend.database.mongodb.entity.FieldBindingMng;
import com.becon.opencelium.backend.mapper.base.Mapper;
import com.becon.opencelium.backend.resource.execution.FieldBindEx;
import org.mapstruct.*;

import java.util.List;

@org.mapstruct.Mapper(
        componentModel = "spring",
        unmappedTargetPolicy = ReportingPolicy.IGNORE,
        unmappedSourcePolicy = ReportingPolicy.IGNORE,
        uses = {EnhancementExMapper.class}

)
@Named("fieldBindExMapper")
public interface FieldBindExMapper extends Mapper<FieldBindEx, FieldBindingMng> {
    @Mappings({
            @Mapping(target = "bindId", source = "id"),
            @Mapping(target = "enhance", source = "enhancement", qualifiedByName = {"enhancementExMapper", "toEntity"}),
    })
    @Named("toEntity")
    FieldBindEx toEntity(FieldBindingMng dto);

    @Override
    default FieldBindingMng toDTO(FieldBindEx entity){
        return null;
    }

    @Named("toEntityAll")
    @Override
    default List<FieldBindEx> toEntityAll(List<FieldBindingMng> dtos) {
        return Mapper.super.toEntityAll(dtos);
    }

    @AfterMapping
    default void setId(@MappingTarget FieldBindEx fieldBindEx, FieldBindingMng fieldBindingMng){
        fieldBindEx.getEnhance().setEnhanceId(fieldBindingMng.getEnhancementId());
    }
}
