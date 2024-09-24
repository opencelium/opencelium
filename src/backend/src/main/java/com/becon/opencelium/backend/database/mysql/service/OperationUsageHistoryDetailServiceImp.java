package com.becon.opencelium.backend.database.mysql.service;

import com.becon.opencelium.backend.database.mysql.entity.OperationUsageHistoryDetail;
import com.becon.opencelium.backend.database.mysql.repository.OperationUsageHistoryDetailRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
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

    @Override
    public Page<OperationUsageHistoryDetail> getAllUsageDetailsByOperationUsageHistoryId(String usageId,int page, int size) {
        Pageable pageable = PageRequest.of(page, size);
        return operationUsageHistoryDetailRepository.findAllByOperationUsageHistoryId(usageId,pageable);
    }
}
