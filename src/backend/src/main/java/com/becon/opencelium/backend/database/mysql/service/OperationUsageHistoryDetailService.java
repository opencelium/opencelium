package com.becon.opencelium.backend.database.mysql.service;

import com.becon.opencelium.backend.database.mysql.entity.OperationUsageHistory;
import com.becon.opencelium.backend.database.mysql.entity.OperationUsageHistoryDetail;
import org.springframework.data.domain.Page;

public interface OperationUsageHistoryDetailService {
    void save(OperationUsageHistoryDetail detail);
    Page<OperationUsageHistoryDetail> getAllUsageDetails(int page, int size);
}
