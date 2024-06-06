package com.becon.opencelium.backend.database.mysql.repository;

import com.becon.opencelium.backend.database.mysql.entity.EventContent;
import org.springframework.data.jpa.repository.JpaRepository;

public interface ContentRepository extends JpaRepository<EventContent,Integer> {

}

