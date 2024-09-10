package com.becon.opencelium.backend.database.mysql.service;

import com.becon.opencelium.backend.database.mysql.entity.OperationUsageHistory;
import com.becon.opencelium.backend.database.mysql.repository.OperationUsageHistoryRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import java.util.List;
import java.util.Optional;

@Service
public class OperationUsageHistoryServiceImpl implements OperationUsageHistoryService {

    @Autowired
    private OperationUsageHistoryRepository operationUsageHistoryRepository;

    @Override
    public void save(OperationUsageHistory operationUsageHistory) {
        operationUsageHistoryRepository.save(operationUsageHistory);
    }

    @Override
    public List<OperationUsageHistory> findAll() {
        return operationUsageHistoryRepository.findAll();
    }

    @Override
    public Optional<OperationUsageHistory> findById(Long id) {
        return operationUsageHistoryRepository.findById(id);
    }

    @Override
    public OperationUsageHistory createEntity(String subId, String connectionName, long operationNumber) {
        OperationUsageHistory operationUsageHistory = new OperationUsageHistory();
        operationUsageHistory.setOperationNum(operationNumber);
        operationUsageHistory.setSubId(subId);
        operationUsageHistory.setConnectionTitle(connectionName);
        return operationUsageHistory;
    }
}
