package com.becon.opencelium.backend.database.mysql.repository;

import com.becon.opencelium.backend.database.mysql.entity.ExecutionArgument;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface ExecutionArgumentRepository extends JpaRepository<ExecutionArgument, Long> {

    List<ExecutionArgument> findAllByExecutionId(Long execId);
}
