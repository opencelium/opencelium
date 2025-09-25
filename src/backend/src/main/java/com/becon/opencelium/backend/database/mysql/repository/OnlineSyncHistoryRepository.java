package com.becon.opencelium.backend.database.mysql.repository;

import com.becon.opencelium.backend.database.mysql.entity.OnlineSyncHistory;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.time.LocalDateTime;
import java.util.List;

@Repository
public interface OnlineSyncHistoryRepository extends JpaRepository<OnlineSyncHistory, Integer> {
    @Query("""
            SELECT h FROM OnlineSyncHistory h
            WHERE (:username IS NULL OR h.username = :username)
            AND (:service IS NULL OR h.service = :service)
            AND (:startTime IS NULL OR h.createdAt >= :startTime)
            AND (:endTime IS NULL OR h.createdAt <= :endTime)
            """)
    List<OnlineSyncHistory> filterHistory(
            @Param("username") String username,
            @Param("service") String service,
            @Param("startTime") LocalDateTime startTime,
            @Param("endTime") LocalDateTime endTime
    );
}
