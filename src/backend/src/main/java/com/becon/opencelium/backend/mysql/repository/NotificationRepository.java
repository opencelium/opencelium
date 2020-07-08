package com.becon.opencelium.backend.mysql.repository;

import com.becon.opencelium.backend.mysql.entity.EventNotification;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

@Repository
public interface NotificationRepository extends JpaRepository<EventNotification, Integer> {
    @Transactional
    List<EventNotification> findBySchedulerId(int schedulerId);
}
