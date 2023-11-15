package com.becon.opencelium.backend.database.mongodb.repository;

import com.becon.opencelium.backend.database.mongodb.entity.MethodMng;
import org.springframework.data.mongodb.repository.MongoRepository;

public interface MethodMngRepository extends MongoRepository<MethodMng, String> {
}
