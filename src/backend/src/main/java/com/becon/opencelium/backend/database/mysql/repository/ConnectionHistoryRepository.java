package com.becon.opencelium.backend.database.mysql.repository;

import com.becon.opencelium.backend.database.mysql.entity.ConnectionHistory;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;

import java.util.List;

public interface ConnectionHistoryRepository extends JpaRepository<ConnectionHistory, Long> {
    @Query(nativeQuery = true, value = "SELECT * FROM connection_history WHERE connection_id=?1 and TIMESTAMPDIFF(SECOND, created, NOW()) < ?2")
    List<ConnectionHistory> findConnectionHistoriesInInterval(long connectionId, long second);
    List<ConnectionHistory> findAllByConnectionId(Long connectionId);
}