package com.becon.opencelium.backend.mapper.connection;

import com.becon.opencelium.backend.database.mongodb.entity.EnhancementMng;
import com.becon.opencelium.backend.database.mysql.entity.Enhancement;
import com.becon.opencelium.backend.resource.connection.binding.EnhancementDTO;
import org.mapstruct.*;

@Mapper(componentModel = "spring", unmappedTargetPolicy = ReportingPolicy.IGNORE)
@Named("enhancementMapper")
public interface EnhancementMapper {
    @Named("toEntity")
    @Mapping(target = "enhancementId", source = "enhanceId")
    EnhancementMng toEntity(EnhancementDTO enhancementDTO);
    @Named("toDTO")
    @InheritInverseConfiguration
    EnhancementDTO toDTO(EnhancementMng enhancementMng);
    @Mapping(target = "id", source = "enhancementId")
    Enhancement toEntity(EnhancementMng enhancementMng);
}
