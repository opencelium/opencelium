package com.becon.opencelium.backend.mysql.service;

import com.becon.opencelium.backend.mysql.entity.ExecutionArgument;
import com.becon.opencelium.backend.mysql.repository.ExecutionArgumentRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import java.util.List;

@Service
public class ExecutionArgumentServiceIml implements ExecutionArgumentService {

    @Autowired
    private ExecutionArgumentRepository executionArgumentRepository;

    @Override
    public void saveAll(List<ExecutionArgument> executionArguments) {
//        executionArgumentRepository.saveAll(executionArguments);
    }

    @Override
    public List<ExecutionArgument> findAllByExecId(Long id) {
        return executionArgumentRepository.findAllByExecutionId(id);
    }


}
