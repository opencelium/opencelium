package com.becon.opencelium.backend.database.mongodb.service;

import com.becon.opencelium.backend.database.mongodb.entity.DataAggregatorMng;
import com.becon.opencelium.backend.resource.connection.aggregator.DataAggregatorDTO;
import org.springframework.stereotype.Service;

public interface DataAggregatorMngService {

    DataAggregatorMng toEntity(DataAggregatorDTO dataAggregatorDTO);

    DataAggregatorDTO toDTO(DataAggregatorMng dataAggregatorMng);
}
