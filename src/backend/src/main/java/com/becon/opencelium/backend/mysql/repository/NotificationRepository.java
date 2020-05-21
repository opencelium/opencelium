package com.becon.opencelium.backend.mysql.repository;

import com.becon.opencelium.backend.mysql.entity.Notification;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.Optional;

@Repository
public interface NotificationRepository extends JpaRepository<Notification, Integer> {
    @Transactional
    List<Notification> findBySchedulerId(int schedulerId);
}
