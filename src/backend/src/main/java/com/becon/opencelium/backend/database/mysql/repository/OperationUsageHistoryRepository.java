package com.becon.opencelium.backend.database.mysql.repository;

import com.becon.opencelium.backend.database.mysql.entity.OperationUsageHistory;
import com.becon.opencelium.backend.database.mysql.entity.Subscription;
import jakarta.persistence.LockModeType;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Lock;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.time.LocalDateTime;
import java.util.Optional;

@Repository
public interface OperationUsageHistoryRepository extends JpaRepository<OperationUsageHistory, Long> {

    Optional<OperationUsageHistory> findByConnectionTitle(String title);
    Page<OperationUsageHistory> findAll(Pageable pageable);

    @Query("SELECT DISTINCT h FROM OperationUsageHistory h JOIN h.details d " +
            "WHERE (:startDate IS NULL OR d.startDate >= :startDate) " +
            "AND (:endDate IS NULL OR d.startDate <= :endDate)")
    Page<OperationUsageHistory> findAllByDetailsStartDateBetween(
            @Param("startDate") LocalDateTime startDate,
            @Param("endDate") LocalDateTime endDate,
            Pageable pageable
    );

    @Modifying
    @Query(value = "UPDATE operation_usage_history " +
            "SET total_usage = total_usage + :opsUsage " +
            "WHERE id = :id",
            nativeQuery = true)
    int incrementUsageByConnectionTitle(@Param("id") Long id,
                                        @Param("opsUsage") long opsUsage);
}