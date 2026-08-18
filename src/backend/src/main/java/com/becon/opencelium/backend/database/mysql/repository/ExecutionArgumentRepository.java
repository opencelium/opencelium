package com.becon.opencelium.backend.database.mysql.repository;

import com.becon.opencelium.backend.database.mysql.entity.ExecutionArgument;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

@Repository
public interface ExecutionArgumentRepository extends JpaRepository<ExecutionArgument, Long> {

    List<ExecutionArgument> findAllByExecutionId(Long execId);

    @Modifying
    @Transactional
    @Query(value = """
            DELETE ea FROM execution_argument ea
            JOIN execution e ON e.id = ea.execution_id
            JOIN scheduler s ON s.id = e.scheduler_id
            WHERE s.connection_id = :connectionId
            """, nativeQuery = true)
    void deleteByConnectionId(@Param("connectionId") Long connectionId);

    @Modifying
    @Transactional
    @Query(value = """
            DELETE ea FROM execution_argument ea
            JOIN execution e ON e.id = ea.execution_id
            WHERE e.scheduler_id = :schedulerId
            """, nativeQuery = true)
    void deleteBySchedulerId(@Param("schedulerId") int schedulerId);
}
