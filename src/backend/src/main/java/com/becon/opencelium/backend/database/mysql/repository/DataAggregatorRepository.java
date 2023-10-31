package com.becon.opencelium.backend.database.mysql.repository;


import com.becon.opencelium.backend.database.mysql.entity.DataAggregator;
import org.springframework.data.jpa.repository.JpaRepository;

public interface DataAggregatorRepository extends JpaRepository<DataAggregator, Integer> {
    boolean existsByName(String name);
}
