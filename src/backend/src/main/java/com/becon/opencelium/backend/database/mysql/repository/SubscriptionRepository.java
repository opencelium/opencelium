package com.becon.opencelium.backend.database.mysql.repository;

import com.becon.opencelium.backend.database.mysql.entity.Subscription;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.stereotype.Repository;
import org.springframework.transaction.annotation.Transactional;

import java.util.Optional;
import java.util.UUID;

@Repository
public interface SubscriptionRepository extends JpaRepository<Subscription, UUID> {
    @Modifying
    @Transactional
    @Query("UPDATE Subscription s SET s.active = false")
    void deactivateAll();

    @Query(value = "select * from subscription ar where ar.active = 1 limit 1", nativeQuery = true)
    Optional<Subscription> findActiveSubs();
}
