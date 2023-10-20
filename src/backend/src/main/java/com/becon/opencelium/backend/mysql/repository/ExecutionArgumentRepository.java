package com.becon.opencelium.backend.mysql.repository;

import com.becon.opencelium.backend.mysql.entity.ExecutionArgument;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface ExecutionArgumentRepository extends JpaRepository<ExecutionArgument, Long> {

    List<ExecutionArgument> findAllByExecutionId(Long execId);
}
