package com.becon.opencelium.backend.mapper.mongo;

import com.becon.opencelium.backend.database.mongodb.entity.LinkedFieldMng;
import com.becon.opencelium.backend.mapper.base.Mapper;
import com.becon.opencelium.backend.resource.connection.binding.LinkedFieldDTO;
import org.mapstruct.Named;
import org.mapstruct.ReportingPolicy;

import java.util.List;

@org.mapstruct.Mapper(componentModel = "spring", unmappedTargetPolicy = ReportingPolicy.IGNORE)
@Named("linkedFieldMngMapper")
public interface LinkedFieldMngMapper extends Mapper<LinkedFieldMng, LinkedFieldDTO>{

    LinkedFieldMng toEntity(LinkedFieldDTO dto);

    LinkedFieldDTO toDTO(LinkedFieldMng entity);

    @Named("toEntityAll")
    default List<LinkedFieldMng> toEntityAll(List<LinkedFieldDTO> dtos) {
        return Mapper.super.toEntityAll(dtos);
    }

    @Named("toDTOAll")
    default List<LinkedFieldDTO> toDTOAll(List<LinkedFieldMng> entities) {
        return Mapper.super.toDTOAll(entities);
    }
}
