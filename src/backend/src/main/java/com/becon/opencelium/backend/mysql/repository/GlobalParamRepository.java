package com.becon.opencelium.backend.mysql.repository;

import com.becon.opencelium.backend.mysql.entity.GlobalParam;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.Optional;

public interface GlobalParamRepository extends JpaRepository<GlobalParam, Integer> {

    List<GlobalParam> findAllByName(String name);
    Optional<GlobalParam> findByName(String name);
}
