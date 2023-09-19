package com.becon.opencelium.backend.database.mongodb.service;

import com.becon.opencelium.backend.database.mongodb.entity.MethodMng;
import com.becon.opencelium.backend.resource.connection.MethodDTO;
import org.springframework.stereotype.Service;

import java.util.ArrayList;
import java.util.List;

public interface MethodMngService {

    MethodMng toEntity(MethodDTO methodDTO);
    List<MethodMng> toEntityAll(List<MethodDTO> methodDTOs);
    List<MethodDTO> toDTOAll(List<MethodMng> methods);
    MethodDTO toDTO(MethodMng methodMng);
}
