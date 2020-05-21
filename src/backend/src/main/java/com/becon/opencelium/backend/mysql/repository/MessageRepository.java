package com.becon.opencelium.backend.mysql.repository;

import com.becon.opencelium.backend.mysql.entity.Message;
import org.springframework.data.jpa.repository.JpaRepository;

public interface MessageRepository extends JpaRepository<Message,Integer> {

}
