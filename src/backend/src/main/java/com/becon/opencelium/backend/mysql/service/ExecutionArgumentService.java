package com.becon.opencelium.backend.mysql.service;

import com.becon.opencelium.backend.mysql.entity.ExecutionArgument;

import java.util.List;

public interface ExecutionArgumentService {
    void saveAll(List<ExecutionArgument> executionArguments);
    List<ExecutionArgument> findAllByExecId(Long id);
}
