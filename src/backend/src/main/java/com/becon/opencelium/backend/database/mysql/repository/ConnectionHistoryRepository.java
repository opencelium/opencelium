package com.becon.opencelium.backend.database.mysql.repository;

import com.becon.opencelium.backend.database.mysql.entity.ConnectionHistory;
import org.springframework.data.jpa.repository.JpaRepository;

public interface ConnectionHistoryRepository extends JpaRepository<ConnectionHistory, Long> {
}