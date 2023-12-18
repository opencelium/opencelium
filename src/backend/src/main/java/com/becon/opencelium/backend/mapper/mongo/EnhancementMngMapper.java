package com.becon.opencelium.backend.mapper.mongo;

import com.becon.opencelium.backend.database.mongodb.entity.EnhancementMng;
import com.becon.opencelium.backend.mapper.base.Mapper;
import com.becon.opencelium.backend.resource.connection.binding.EnhancementDTO;
import org.mapstruct.Named;
import org.mapstruct.ReportingPolicy;

@org.mapstruct.Mapper(componentModel = "spring", unmappedTargetPolicy = ReportingPolicy.IGNORE)
@Named("enhancementMngMapper")
public interface EnhancementMngMapper extends Mapper<EnhancementMng, EnhancementDTO>{
    @Named("toEntity")
    EnhancementMng toEntity(EnhancementDTO enhancementDTO);

    @Named("toDTO")
    EnhancementDTO toDTO(EnhancementMng enhancementMng);
}
