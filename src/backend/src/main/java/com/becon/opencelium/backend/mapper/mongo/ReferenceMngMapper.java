package com.becon.opencelium.backend.mapper.mongo;

import com.becon.opencelium.backend.database.mongodb.entity.ReferenceMng;
import com.becon.opencelium.backend.mapper.base.Mapper;
import com.becon.opencelium.backend.resource.connection.ReferenceDTO;
import org.mapstruct.Named;
import org.mapstruct.ReportingPolicy;

import java.util.List;

@org.mapstruct.Mapper(
        componentModel = "spring",
        unmappedTargetPolicy = ReportingPolicy.IGNORE
)
@Named("fieldBindingMngMapper")
public interface ReferenceMngMapper extends Mapper<ReferenceMng, ReferenceDTO>{

    ReferenceMng toEntity(ReferenceDTO dto);

    ReferenceDTO toDTO(ReferenceMng entity);

    @Named("toEntityAll")
    default List<ReferenceMng> toEntityAll(List<ReferenceDTO> dtos) {
        return Mapper.super.toEntityAll(dtos);
    }

    @Named("toDTOAll")
    default List<ReferenceDTO> toDTOAll(List<ReferenceMng> entities) {
        return Mapper.super.toDTOAll(entities);
    }
}
