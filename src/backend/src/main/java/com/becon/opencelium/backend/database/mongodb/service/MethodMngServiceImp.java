package com.becon.opencelium.backend.database.mongodb.service;

import org.springframework.data.mongodb.core.MongoTemplate;
import org.springframework.stereotype.Service;

@Service
public class MethodMngServiceImp implements MethodMngService {

    private final MongoTemplate mongoTemplate;

    public MethodMngServiceImp(MongoTemplate mongoTemplate) {
        this.mongoTemplate = mongoTemplate;
    }

    @Override
    public void deleteAll() {
        mongoTemplate.dropCollection("method");
    }
}
