package com.becon.opencelium.backend.database.mysql.repository;

import com.becon.opencelium.backend.database.mysql.entity.OperationUsageHistory;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.Optional;

@Repository
public interface OperationUsageHistoryRepository extends JpaRepository<OperationUsageHistory, Long> {

    Optional<OperationUsageHistory> findByConnectionTitle(String title);
}