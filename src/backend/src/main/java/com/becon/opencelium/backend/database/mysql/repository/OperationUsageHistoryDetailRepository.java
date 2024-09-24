package com.becon.opencelium.backend.database.mysql.repository;

import com.becon.opencelium.backend.database.mysql.entity.OperationUsageHistoryDetail;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;

public interface OperationUsageHistoryDetailRepository extends JpaRepository<OperationUsageHistoryDetail, Long> {
    Page<OperationUsageHistoryDetail> findAllByOperationUsageHistoryId(String usageId, Pageable pageable);
}
