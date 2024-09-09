package com.becon.opencelium.backend.database.mysql.service;

import com.becon.opencelium.backend.database.mysql.entity.OperationUsageHistory;

import java.util.List;
import java.util.Optional;

public interface OperationUsageHistoryService {
    void save(OperationUsageHistory operationUsageHistory);
    List<OperationUsageHistory> findAll();
    Optional<OperationUsageHistory> findById(Long id);
}
