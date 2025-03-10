package com.becon.opencelium.backend.database.mysql.repository;

import com.becon.opencelium.backend.database.mysql.entity.ExtraOps;
import com.becon.opencelium.backend.subscription.enums.ExtraOpsStatus;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

@Repository
public interface ExtraOpsRepository extends JpaRepository<ExtraOps, Long> {

    boolean existsByStatus(ExtraOpsStatus status);
}
