package com.becon.opencelium.backend.database.mysql.service;

import com.becon.opencelium.backend.database.mysql.entity.Argument;
import com.becon.opencelium.backend.database.mysql.repository.ArgumentRepository;
import com.becon.opencelium.backend.resource.connection.aggregator.ArgumentDTO;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import java.util.Optional;

@Service("ArgumentServiceImp")
public class ArgumentServiceImp implements ArgumentService {
    @Autowired
    private ArgumentRepository argumentRepository;

    @Override
    public ArgumentDTO convertToDto(Argument argument) {
        ArgumentDTO argumentDTO = new ArgumentDTO();
        argumentDTO.setId(argument.getId());
        argumentDTO.setName(argument.getName());
        argumentDTO.setDescription(argument.getDescription());
        return argumentDTO;
    }

    @Override
    public Argument convertToEntity(ArgumentDTO argumentDTO) {
        Argument argument = new Argument();
        argument.setId(argumentDTO.getId());
        argument.setName(argumentDTO.getName());
        argument.setDescription(argumentDTO.getDescription());
        return argument;
    }

    @Override
    public void deleteById(Integer argId) {
        argumentRepository.deleteById(argId);
    }

    @Override
    public Optional<Argument> findById(int argId) {
        return argumentRepository.findById(argId);
    }

}
