package com.becon.opencelium.backend.database.mysql.service;

import com.becon.opencelium.backend.database.mysql.entity.OperationUsageHistory;
import com.becon.opencelium.backend.database.mysql.entity.Subscription;

import java.util.List;
import java.util.Optional;

public interface OperationUsageHistoryService {
    void save(OperationUsageHistory operationUsageHistory);
    List<OperationUsageHistory> findAll();
    Optional<OperationUsageHistory> findById(Long id);
    OperationUsageHistory createNewEntity(Subscription subId, String connectionName, long requestSize, long startTime);

    Optional<OperationUsageHistory> findByConnectionTitle(String title);
}
