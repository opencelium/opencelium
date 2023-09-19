package com.becon.opencelium.backend.database.mongodb.service;

import com.becon.opencelium.backend.database.mongodb.entity.EnhancementMng;
import com.becon.opencelium.backend.database.mysql.entity.Enhancement;
import com.becon.opencelium.backend.resource.connection.binding.EnhancementDTO;

public interface EnhancementMngService {
    EnhancementMng toEntity(EnhancementDTO enhancementDTO);

    Enhancement toEntity(EnhancementMng enhancementMng);

    EnhancementDTO toDTO(EnhancementMng enhancement);
}
