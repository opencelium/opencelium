package com.becon.opencelium.backend.database.mongodb.repository;

import com.becon.opencelium.backend.database.mongodb.entity.MethodMng;
import org.bson.types.ObjectId;
import org.springframework.data.mongodb.repository.MongoRepository;
import org.springframework.data.mongodb.repository.Query;

import java.util.Optional;

public interface MethodMngRepository extends MongoRepository<MethodMng, String> {
    Optional<MethodMng> findByColor(String methodKey);
}
