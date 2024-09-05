package com.becon.opencelium.backend.database.mysql.repository;

import com.becon.opencelium.backend.database.mysql.entity.ActivationRequest;
import jakarta.transaction.Transactional;
import org.springframework.data.jpa.repository.*;
import org.springframework.stereotype.Repository;

import java.util.Optional;
import java.util.UUID;

@Repository
public interface ActivationRequestRepository extends JpaRepository<ActivationRequest, UUID> {

    @Modifying
    @Transactional
    @Query("UPDATE ActivationRequest ar SET ar.status = com.becon.opencelium.backend.enums.ActivReqStatus.EXPIRED")
    void expireAllActivationRequests();
    @Query(value = "select * from activation_request ar where ar.status <> 'EXPIRED' limit 1", nativeQuery = true)
    Optional<ActivationRequest> findActiveAR();

    Optional<ActivationRequest> findByHmac(String hmac);
}
