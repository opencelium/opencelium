package com.becon.opencelium.backend.database.mongodb.repository;

import com.becon.opencelium.backend.database.mongodb.entity.MapperMng;
import org.springframework.data.mongodb.repository.MongoRepository;
import org.springframework.stereotype.Repository;

@Repository
public interface MapperMngRepository extends MongoRepository<MapperMng, String> {
}
