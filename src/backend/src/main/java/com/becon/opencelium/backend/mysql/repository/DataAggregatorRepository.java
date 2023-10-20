package com.becon.opencelium.backend.mysql.repository;

import com.becon.opencelium.backend.mysql.entity.DataAggregator;
import org.springframework.data.jpa.repository.JpaRepository;

public interface DataAggregatorRepository extends JpaRepository<DataAggregator, Integer> {
    boolean existsByName(String name);
}
