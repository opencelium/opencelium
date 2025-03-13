package com.becon.opencelium.backend.database.mysql.service;

import com.becon.opencelium.backend.database.mysql.entity.OperationUsageHistoryDetail;
import com.becon.opencelium.backend.database.mysql.repository.OperationUsageHistoryDetailRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;
import org.springframework.stereotype.Service;

import java.time.Instant;
import java.time.LocalDateTime;
import java.time.ZoneId;
import java.util.List;

@Service
public class OperationUsageHistoryDetailServiceImp implements OperationUsageHistoryDetailService {

    @Autowired
    private OperationUsageHistoryDetailRepository operationUsageHistoryDetailRepository;

    @Override
    public void save(OperationUsageHistoryDetail detail) {
        operationUsageHistoryDetailRepository.save(detail);
    }

    @Override
    public Page<OperationUsageHistoryDetail> getAllUsageDetailsByOperationUsageHistoryId(Long usageId,int page,
                                                                                         int size, String[] sort) {
        Sort.Direction direction = Sort.Direction.fromString(sort[1]);
        Sort sortBy = Sort.by(direction, sort[0]);
        Pageable pageable = PageRequest.of(page, size, sortBy);
        return operationUsageHistoryDetailRepository.findAllByOperationUsageHistoryId(usageId,pageable);
    }

    @Override
    public Page<OperationUsageHistoryDetail> findDetailsByHistoryIdAndStartDateBetween(Long historyId, LocalDateTime startDate, LocalDateTime endDate, Pageable pageable) {
        return operationUsageHistoryDetailRepository.findDetailsByHistoryIdAndStartDateBetween(historyId, startDate, endDate, pageable);
    }

    @Override
    public List<OperationUsageHistoryDetail> findDetailsByHistoryIdAndStartDateBetween(Long historyId, LocalDateTime startDate, LocalDateTime endDate) {
        return operationUsageHistoryDetailRepository.findDetailsByHistoryIdAndStartDateBetween(historyId, startDate, endDate);
    }
}
