package com.becon.opencelium.backend.mysql.repository;

import com.becon.opencelium.backend.mysql.entity.EventContent;
import org.springframework.data.jpa.repository.JpaRepository;

public interface ContentRepository extends JpaRepository<EventContent,Integer> {

}

