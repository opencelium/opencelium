package com.becon.opencelium.backend.database.mysql.service;


import com.becon.opencelium.backend.database.mysql.entity.ExecutionArgument;

import java.util.List;

public interface ExecutionArgumentService {
    void saveAll(List<ExecutionArgument> executionArguments);
    List<ExecutionArgument> findAllByExecId(Long id);
}
