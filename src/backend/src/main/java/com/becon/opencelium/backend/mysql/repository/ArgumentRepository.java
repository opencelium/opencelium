package com.becon.opencelium.backend.mysql.repository;

import com.becon.opencelium.backend.mysql.entity.Argument;
import org.springframework.data.jpa.repository.JpaRepository;

public interface ArgumentRepository extends JpaRepository<Argument, Integer> {
}
