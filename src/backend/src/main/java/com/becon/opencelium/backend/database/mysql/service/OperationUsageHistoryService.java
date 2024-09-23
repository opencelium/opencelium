package com.becon.opencelium.backend.database.mysql.service;

import com.becon.opencelium.backend.database.mysql.entity.OperationUsageHistory;
import com.becon.opencelium.backend.database.mysql.entity.OperationUsageHistoryDetail;
import com.becon.opencelium.backend.database.mysql.entity.Subscription;
import com.becon.opencelium.backend.resource.subs.OperationUsageDetailsDto;
import com.becon.opencelium.backend.resource.subs.PaginatedDto;
import org.springframework.data.domain.Page;

import java.util.List;
import java.util.Optional;

public interface OperationUsageHistoryService {
    void save(OperationUsageHistory operationUsageHistory);
    List<OperationUsageHistory> findAll();
    Page<OperationUsageHistory> getAllUsage(int page, int size);
    Page<OperationUsageHistoryDetail> getAllUsageDetails(int page, int size);
    Optional<OperationUsageHistory> findById(Long id);
    OperationUsageHistory createNewEntity(Subscription subId, String connectionName, long requestSize, long startTime);

    Optional<OperationUsageHistory> findByConnectionTitle(String title);
    PaginatedDto toPaginatedDto(Page<OperationUsageHistory> page);
    PaginatedDto toUsageDetailsDto(Page<OperationUsageHistoryDetail> page);
}
