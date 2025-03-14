package com.becon.opencelium.backend.database.mysql.repository;

import com.becon.opencelium.backend.database.mysql.entity.ExtraOps;
import com.becon.opencelium.backend.database.mysql.entity.OperationUsageHistory;
import com.becon.opencelium.backend.subscription.enums.ExtraOpsStatus;
import jakarta.persistence.LockModeType;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Lock;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.Optional;

@Repository
public interface ExtraOpsRepository extends JpaRepository<ExtraOps, Long> {

    boolean existsByStatus(ExtraOpsStatus status);

    boolean existsByGeneratedAt(long generatedAt);

    @Lock(LockModeType.PESSIMISTIC_WRITE)
    @Query("SELECT o FROM ExtraOps o WHERE o.id = :extraOpsId")
    Optional<ExtraOps> findAndLockById(@Param("extraOpsId") Long extraOpsId);
}
