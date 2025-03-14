package com.becon.opencelium.backend.database.mysql.service;

import com.becon.opencelium.backend.database.mysql.entity.OperationUsageHistory;
import com.becon.opencelium.backend.database.mysql.entity.OperationUsageHistoryDetail;
import com.becon.opencelium.backend.database.mysql.entity.Subscription;
import com.becon.opencelium.backend.resource.subs.PaginatedDto;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;

public interface OperationUsageHistoryService {
    void save(OperationUsageHistory operationUsageHistory);
    List<OperationUsageHistory> findAll();
    Page<OperationUsageHistory> getAllUsage(int page, int size, String[] sort);
    Page<OperationUsageHistoryDetail> getAllUsageDetailsByUsageId(Long usageId,int page, int size, String[] sort, LocalDateTime startDate, LocalDateTime endTime);
    Optional<OperationUsageHistory> findById(Long id);
    OperationUsageHistory createNewEntity(Subscription sub, String connectionName,
                                          long operationUsage, long startTime,
                                          String sourceInvoker, String targetInvoker);

    Optional<OperationUsageHistory> findByConnectionTitle(String title);
    PaginatedDto toPaginatedDto(Page<OperationUsageHistory> page);
    PaginatedDto toUsageDetailsDto(Page<OperationUsageHistoryDetail> page);

    Page<OperationUsageHistory> findAllByDetailsStartDateBetween(int page, int size, Long startDate, Long endDate, String[] sort) ;

    void incrementUsageByConnectionTitle(Long id, long opsUsage);
}
