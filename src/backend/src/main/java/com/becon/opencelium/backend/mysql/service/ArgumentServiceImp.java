package com.becon.opencelium.backend.mysql.service;

import com.becon.opencelium.backend.mysql.entity.Argument;
import com.becon.opencelium.backend.mysql.repository.ArgumentRepository;
import com.becon.opencelium.backend.resource.connection.aggregator.ArgumentDTO;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

@Service("ArgumentServiceImp")
public class ArgumentServiceImp implements ArgumentService {
    @Autowired
    private ArgumentRepository argumentRepository;

    @Override
    public ArgumentDTO convertToDto(Argument argument) {
        ArgumentDTO argumentDTO = new ArgumentDTO();
        argumentDTO.setName(argument.getName());
        argumentDTO.setDescription(argument.getDescription());
        return argumentDTO;
    }

    @Override
    public Argument convertToEntity(ArgumentDTO argumentDTO) {
        Argument argument = new Argument();
        argument.setName(argumentDTO.getName());
        argument.setDescription(argumentDTO.getDescription());
        return argument;
    }

    @Override
    public void deleteById(Integer argId) {
        argumentRepository.deleteById(argId);
    }
}
