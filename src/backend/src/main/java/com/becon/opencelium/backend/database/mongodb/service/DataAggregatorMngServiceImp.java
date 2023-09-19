package com.becon.opencelium.backend.database.mongodb.service;

import com.becon.opencelium.backend.database.mongodb.entity.DataAggregatorMng;
import com.becon.opencelium.backend.resource.connection.aggregator.DataAggregatorDTO;
import org.springframework.stereotype.Service;

@Service
public class DataAggregatorMngServiceImp implements DataAggregatorMngService{
    private final ArgumentMngService argumentMngService;

    public DataAggregatorMngServiceImp(ArgumentMngService argumentMngService) {
        this.argumentMngService = argumentMngService;
    }

    @Override
    public DataAggregatorMng toEntity(DataAggregatorDTO dataAggregatorDTO) {
        DataAggregatorMng dataAggregatorMng = new DataAggregatorMng();
        dataAggregatorMng.setName(dataAggregatorDTO.getName());
        dataAggregatorMng.setScript(dataAggregatorDTO.getScript());
        dataAggregatorMng.setArgs(argumentMngService.toEntityAll(dataAggregatorDTO.getArgs()));
        return dataAggregatorMng;
    }

    @Override
    public DataAggregatorDTO toDTO(DataAggregatorMng dataAggregatorMng) {
        DataAggregatorDTO dataAggregatorDTO = new DataAggregatorDTO();
        dataAggregatorDTO.setId(dataAggregatorMng.getId());
        dataAggregatorDTO.setName(dataAggregatorMng.getName());
        dataAggregatorDTO.setScript(dataAggregatorMng.getScript());
        dataAggregatorDTO.setArgs(argumentMngService.toDTOAll(dataAggregatorMng.getArgs()));
        return dataAggregatorDTO;
    }
}
