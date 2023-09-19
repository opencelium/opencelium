package com.becon.opencelium.backend.database.mongodb.service;

import com.becon.opencelium.backend.database.mongodb.entity.LinkedFieldMng;
import com.becon.opencelium.backend.resource.connection.binding.LinkedFieldDTO;
import org.springframework.stereotype.Service;

import java.util.ArrayList;
import java.util.List;

public interface LinkedFieldMngService {
    LinkedFieldMng toEntity(LinkedFieldDTO linkedFieldDTO);
    List<LinkedFieldMng> toEntityAll(List<LinkedFieldDTO> linkedFieldDTOs);

    List<LinkedFieldDTO> toDTOAll(List<LinkedFieldMng> linkedFieldMngs);
    LinkedFieldDTO toDTO(LinkedFieldMng linkedFieldMng);
}
