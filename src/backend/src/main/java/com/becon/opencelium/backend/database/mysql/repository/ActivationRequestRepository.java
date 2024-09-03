package com.becon.opencelium.backend.database.mysql.repository;

import com.becon.opencelium.backend.database.mysql.entity.ActivationRequest;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.stereotype.Repository;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

@Repository
public interface ActivationRequestRepository extends JpaRepository<ActivationRequest, UUID> {
    @Modifying
    @Transactional
    @Query("UPDATE ActivationRequest ar SET ar.status = 'EXPIRED' where ar.status <> 'EXPIRED'")
    void expireAllActivationRequests();

    @Query(value = "select * from activation_request ar where ar.status <> 'EXPIRED' limit 1", nativeQuery = true)
    Optional<ActivationRequest> findActiveAR();
}
