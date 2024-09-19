package com.becon.opencelium.backend.database.mysql.repository;

import com.becon.opencelium.backend.database.mysql.entity.OperationUsageHistoryDetail;
import org.springframework.data.jpa.repository.JpaRepository;

public interface OperationUsageHistoryDetailRepository extends JpaRepository<OperationUsageHistoryDetail, Long> {
}
