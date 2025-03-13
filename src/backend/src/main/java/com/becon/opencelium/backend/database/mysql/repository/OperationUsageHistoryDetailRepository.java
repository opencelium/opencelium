package com.becon.opencelium.backend.database.mysql.repository;

import com.becon.opencelium.backend.database.mysql.entity.OperationUsageHistoryDetail;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.time.LocalDateTime;
import java.util.List;

public interface OperationUsageHistoryDetailRepository extends JpaRepository<OperationUsageHistoryDetail, Long> {
    Page<OperationUsageHistoryDetail> findAllByOperationUsageHistoryId(Long usageId, Pageable pageable);

    @Query("SELECT d FROM OperationUsageHistoryDetail d " +
            "WHERE d.operationUsageHistory.id = :historyId " +
            "AND (:startDate IS NULL OR d.startDate >= :startDate) " +
            "AND (:endDate IS NULL OR d.startDate <= :endDate)")
    Page<OperationUsageHistoryDetail> findDetailsByHistoryIdAndStartDateBetween(
            @Param("historyId") Long historyId,
            @Param("startDate") LocalDateTime startDate,
            @Param("endDate") LocalDateTime endDate,
            Pageable pageable);

    @Query("SELECT d FROM OperationUsageHistoryDetail d " +
            "WHERE d.operationUsageHistory.id = :historyId " +
            "AND (:startDate IS NULL OR d.startDate >= :startDate) " +
            "AND (:endDate IS NULL OR d.startDate <= :endDate)")
    List<OperationUsageHistoryDetail> findDetailsByHistoryIdAndStartDateBetween(
            @Param("historyId") Long historyId,
            @Param("startDate") LocalDateTime startDate,
            @Param("endDate") LocalDateTime endDate);
}
