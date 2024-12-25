package com.becon.opencelium.backend.database.mysql.repository;

import com.becon.opencelium.backend.database.mysql.entity.ActivationRequest;
import com.becon.opencelium.backend.enums.ActivReqStatus;
import jakarta.transaction.Transactional;
import org.springframework.data.jpa.repository.*;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.Optional;
import java.util.UUID;

@Repository
public interface ActivationRequestRepository extends JpaRepository<ActivationRequest, String> {

    @Modifying
    @Transactional
    @Query("UPDATE ActivationRequest ar SET ar.status = com.becon.opencelium.backend.enums.ActivReqStatus.EXPIRED " +
            "WHERE ar.status = com.becon.opencelium.backend.enums.ActivReqStatus.PENDING")
    void expireAllActivationRequests();

    @Modifying
    @Transactional
    @Query("UPDATE ActivationRequest ar SET ar.active = false")
    void deactivateAll();

    @Query(value = "select * from activation_request ar where ar.active=true limit 1", nativeQuery = true)
    Optional<ActivationRequest> findActiveAR();

    Optional<ActivationRequest> findFirstByHmac(String hmac);

    @Modifying
    @Transactional
    @Query("UPDATE ActivationRequest ar SET ar.status = :newStatus WHERE ar.id = :id AND ar.status != :processedStatus")
    void updateStatusIfNotProcessed(
            @Param("id") String id,
            @Param("newStatus") ActivReqStatus newStatus,
            @Param("processedStatus") ActivReqStatus processedStatus
    );
}
