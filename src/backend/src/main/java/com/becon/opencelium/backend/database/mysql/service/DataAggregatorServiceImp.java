package com.becon.opencelium.backend.database.mysql.service;

import com.becon.opencelium.backend.database.mysql.entity.Argument;
import com.becon.opencelium.backend.database.mysql.entity.DataAggregator;
import com.becon.opencelium.backend.database.mysql.repository.DataAggregatorRepository;
import com.becon.opencelium.backend.resource.connection.aggregator.ArgumentDTO;
import com.becon.opencelium.backend.resource.connection.aggregator.DataAggregatorDTO;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.beans.factory.annotation.Qualifier;
import org.springframework.stereotype.Service;

import java.util.List;
import java.util.Set;
import java.util.stream.Collectors;

@Service("DataAggregatorServiceImp")
public class DataAggregatorServiceImp implements DataAggregatorService {

    private final ArgumentService argumentService;
    private final DataAggregatorRepository dataAggregatorRepository;

    @Autowired
    public DataAggregatorServiceImp(@Qualifier("ArgumentServiceImp") ArgumentService argumentService,
                                    DataAggregatorRepository dataAggregatorRepository) {
        this.argumentService = argumentService;
        this.dataAggregatorRepository = dataAggregatorRepository;
    }

    @Override
    public DataAggregatorDTO convertToDto(DataAggregator dataAggregator) {
        DataAggregatorDTO dataAggregatorDTO = new DataAggregatorDTO();
        dataAggregatorDTO.setId(dataAggregator.getId());
        dataAggregatorDTO.setName(dataAggregator.getName());
        dataAggregatorDTO.setScript(dataAggregator.getScript());
        dataAggregatorDTO.setActive(dataAggregator.isActive());

        List<ArgumentDTO> argumentDtos = dataAggregator.getArgs().stream().map(argumentService::convertToDto).toList();
        dataAggregatorDTO.setArgs(argumentDtos);

        return dataAggregatorDTO;
    }

    @Override
    public DataAggregator convertToEntity(DataAggregatorDTO dataAggregatorDTO) {
        DataAggregator dataAggregator = new DataAggregator();
        dataAggregator.setId(dataAggregatorDTO.getId());
        dataAggregator.setName(dataAggregatorDTO.getName());
        dataAggregator.setActive(dataAggregatorDTO.isActive());
        dataAggregator.setScript(dataAggregatorDTO.getScript());
        dataAggregator.setActive(dataAggregatorDTO.isActive());


        Set<Argument> arguments = dataAggregatorDTO.getArgs().stream()
                .map(argumentService::convertToEntity).collect(Collectors.toSet());
        arguments.forEach(arg -> arg.setDataAggregator(dataAggregator));
        dataAggregator.setArgs(arguments);
        return dataAggregator;
    }

    @Override
    public void save(DataAggregator dataAggregator) {
        dataAggregatorRepository.save(dataAggregator);
    }

    @Override
    public DataAggregator getById(Integer id) {
        return dataAggregatorRepository.findById(id)
                .orElseThrow(()-> new RuntimeException("Aggregator with id=" + id + " not found"));
    }

    @Override
    public void deleteById(Integer id) {
        dataAggregatorRepository.deleteById(id);
    }

    @Override
    public List<DataAggregator> findAll() {
        return dataAggregatorRepository.findAll();
    }

    @Override
    public Boolean existsByName(String argName) {
        return dataAggregatorRepository.existsByName(argName);
    }
}
