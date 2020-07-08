package com.becon.opencelium.backend.mysql.repository;

import com.becon.opencelium.backend.mysql.entity.EventRecipient;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

@Repository
public interface RecipientRepository extends JpaRepository<EventRecipient, Integer> {
}
