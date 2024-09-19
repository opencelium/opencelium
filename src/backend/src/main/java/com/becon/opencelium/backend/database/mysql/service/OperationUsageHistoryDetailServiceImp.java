package com.becon.opencelium.backend.database.mysql.service;

import com.becon.opencelium.backend.database.mysql.entity.OperationUsageHistoryDetail;
import com.becon.opencelium.backend.database.mysql.repository.OperationUsageHistoryDetailRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import java.time.Instant;
import java.time.ZoneId;

@Service
public class OperationUsageHistoryDetailServiceImp implements OperationUsageHistoryDetailService {

    @Autowired
    private OperationUsageHistoryDetailRepository operationUsageHistoryDetailRepository;

    @Override
    public void save(OperationUsageHistoryDetail detail) {
        operationUsageHistoryDetailRepository.save(detail);
    }
}
