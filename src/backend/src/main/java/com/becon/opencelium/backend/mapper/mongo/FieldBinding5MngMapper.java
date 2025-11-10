package com.becon.opencelium.backend.mapper.mongo;

import com.becon.opencelium.backend.database.mongodb.entity.FieldBindingMng;
import com.becon.opencelium.backend.mapper.base.Mapper;
import com.becon.opencelium.backend.resource.connection.FieldBinding5DTO;
import org.mapstruct.Named;
import org.mapstruct.ReportingPolicy;

import java.util.List;

@org.mapstruct.Mapper(
        componentModel = "spring",
        unmappedTargetPolicy = ReportingPolicy.IGNORE
)
@Named("fieldBindingMngMapper")
public interface FieldBinding5MngMapper extends Mapper<FieldBindingMng, FieldBinding5DTO>{

    FieldBindingMng toEntity(FieldBinding5DTO dto);

    FieldBinding5DTO toDTO(FieldBindingMng entity);

    @Named("toEntityAll")
    default List<FieldBindingMng> toEntityAll(List<FieldBinding5DTO> dtos) {
        return Mapper.super.toEntityAll(dtos);
    }

    @Named("toDTOAll")
    default List<FieldBinding5DTO> toDTOAll(List<FieldBindingMng> entities) {
        return Mapper.super.toDTOAll(entities);
    }
}
