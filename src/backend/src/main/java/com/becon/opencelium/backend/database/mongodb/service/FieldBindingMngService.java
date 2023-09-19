package com.becon.opencelium.backend.database.mongodb.service;

import com.becon.opencelium.backend.database.mongodb.entity.FieldBindingMng;
import com.becon.opencelium.backend.resource.connection.binding.FieldBindingDTO;
import org.springframework.stereotype.Service;

import java.util.ArrayList;
import java.util.List;

public interface FieldBindingMngService {

    FieldBindingMng toEntity(FieldBindingDTO fieldBindingDTO);
    List<FieldBindingMng> toEntityAll(List<FieldBindingDTO> fieldBindingDTOs);

    List<FieldBindingDTO> toDTOAll(List<FieldBindingMng> fieldBindingMngs);
    FieldBindingDTO toDTO(FieldBindingMng fieldBindingMngs);
}
