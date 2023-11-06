package com.becon.opencelium.backend.mapper.mongo;

import com.becon.opencelium.backend.database.mongodb.entity.EnhancementMng;
import com.becon.opencelium.backend.database.mysql.entity.Enhancement;
import com.becon.opencelium.backend.resource.connection.binding.EnhancementDTO;
import com.becon.opencelium.backend.mapper.base.Mapper;
import org.mapstruct.*;

@org.mapstruct.Mapper(componentModel = "spring", unmappedTargetPolicy = ReportingPolicy.IGNORE)
@Named("enhancementMngMapper")
public interface EnhancementMngMapper extends Mapper<EnhancementMng, EnhancementDTO>{
    @Named("toEntity")
    @Mapping(target = "enhancementId", source = "enhanceId")
    EnhancementMng toEntity(EnhancementDTO enhancementDTO);

    @Named("toDTO")
    @InheritInverseConfiguration
    EnhancementDTO toDTO(EnhancementMng enhancementMng);
}
