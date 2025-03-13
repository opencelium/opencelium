package com.becon.opencelium.backend.database.mysql.service;

import com.becon.opencelium.backend.database.mysql.entity.OperationUsageHistoryDetail;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;

import java.time.LocalDateTime;
import java.util.List;

public interface OperationUsageHistoryDetailService {
    void save(OperationUsageHistoryDetail detail);
    Page<OperationUsageHistoryDetail> getAllUsageDetailsByOperationUsageHistoryId(Long usageId,int page, int size,
                                                                                  String[] sort);

    Page<OperationUsageHistoryDetail> findDetailsByHistoryIdAndStartDateBetween(Long historyId, LocalDateTime startDate, LocalDateTime endDate, Pageable pageable);

}
