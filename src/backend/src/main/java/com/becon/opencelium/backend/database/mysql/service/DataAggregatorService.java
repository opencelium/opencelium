package com.becon.opencelium.backend.database.mysql.service;

import com.becon.opencelium.backend.database.mysql.entity.DataAggregator;
import com.becon.opencelium.backend.resource.connection.aggregator.DataAggregatorDTO;

import java.util.List;

public interface DataAggregatorService {
    DataAggregatorDTO convertToDto(DataAggregator dataAggregator);

    DataAggregator convertToEntity(DataAggregatorDTO dataAggregatorDTO);

    void save(DataAggregator dataAggregator);

    DataAggregator getById(Integer id);

    void deleteById(Integer id);

    List<DataAggregator> findAll();

    Boolean existsByName(String name);
}
