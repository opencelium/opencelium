package com.becon.opencelium.backend.database.mysql.repository;

import com.becon.opencelium.backend.database.mysql.entity.Argument;
import org.springframework.data.jpa.repository.JpaRepository;

public interface ArgumentRepository extends JpaRepository<Argument, Integer> {

}
