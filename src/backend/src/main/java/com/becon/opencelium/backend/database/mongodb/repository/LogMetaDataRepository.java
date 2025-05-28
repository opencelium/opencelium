package com.becon.opencelium.backend.database.mongodb.repository;

import com.becon.opencelium.backend.database.mongodb.entity.LogMetaData;
import org.springframework.data.mongodb.repository.MongoRepository;
import org.springframework.stereotype.Repository;

@Repository
public interface LogMetaDataRepository extends MongoRepository<LogMetaData, String> {
}