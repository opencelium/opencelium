package com.becon.opencelium.backend.database.mysql.repository;

import com.becon.opencelium.backend.database.mysql.entity.Subscription;
import jakarta.persistence.LockModeType;
import jakarta.transaction.Transactional;
import org.springframework.data.jpa.repository.*;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.Optional;
import java.util.UUID;

@Repository
public interface SubscriptionRepository extends JpaRepository<Subscription, String> {
    @Modifying
    @Transactional
    @Query("UPDATE Subscription s SET s.active = false")
    void deactivateAll();

    @Transactional
    void deleteByLicenseId(String licenseId);
    @Transactional
    void deleteBySubId(String subId);

//    @Query(value = "select * from subscription ar where ar.active = 1 limit 1", nativeQuery = true)
    Optional<Subscription> findFirstByActiveTrue();

    Optional<Subscription> findBySubId(String subId);

    boolean existsBySubId(String subId);

    Optional<Subscription> findByLicenseId(String licenseId);

    @Lock(LockModeType.PESSIMISTIC_WRITE)
    @Query("SELECT o FROM Subscription o WHERE o.id = :subId")
    Optional<Subscription> findAndLockById(@Param("subId") String subId);

}
