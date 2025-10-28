package com.becon.opencelium.backend.database.mysql.repository;

import com.becon.opencelium.backend.database.mysql.entity.InvokerSync;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.Optional;

@Repository
public interface InvokerSyncRepository extends JpaRepository<InvokerSync, Integer> {
    Optional<InvokerSync> findByInvokerName(String invokerName);
}
