package com.becon.opencelium.backend.database.mongodb.repository;

import com.becon.opencelium.backend.database.mongodb.entity.FieldBindingMng;
import org.springframework.data.mongodb.repository.MongoRepository;

public interface FieldBindingRepository extends MongoRepository<FieldBindingMng, String> {
}
