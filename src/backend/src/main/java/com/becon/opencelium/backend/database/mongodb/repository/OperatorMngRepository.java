package com.becon.opencelium.backend.database.mongodb.repository;

import com.becon.opencelium.backend.database.mongodb.entity.OperatorMng;
import org.springframework.data.mongodb.repository.MongoRepository;

public interface OperatorMngRepository extends MongoRepository<OperatorMng, String> {
}
