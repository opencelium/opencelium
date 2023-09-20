package com.becon.opencelium.backend.mysql.repository;

import com.becon.opencelium.backend.mysql.entity.Argument;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;

public interface ArgumentRepository extends JpaRepository<Argument, Integer> {

}
