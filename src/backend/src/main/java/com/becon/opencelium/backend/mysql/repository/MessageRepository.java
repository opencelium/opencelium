package com.becon.opencelium.backend.mysql.repository;

import com.becon.opencelium.backend.mysql.entity.EventMessage;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;

public interface MessageRepository extends JpaRepository<EventMessage,Integer> {

    List<EventMessage> findAllByType(String type);
}
