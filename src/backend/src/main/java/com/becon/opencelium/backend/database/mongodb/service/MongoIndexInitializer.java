package com.becon.opencelium.backend.database.mongodb.service;

import com.becon.opencelium.backend.database.mongodb.entity.LogDataMng;
import org.springframework.context.event.ContextRefreshedEvent;
import org.springframework.context.event.EventListener;
import org.springframework.data.domain.Sort;
import org.springframework.data.mongodb.core.MongoTemplate;
import org.springframework.data.mongodb.core.index.Index;
import org.springframework.data.mongodb.core.index.IndexOperations;
import org.springframework.stereotype.Component;

@Component
public class MongoIndexInitializer {

    private final MongoTemplate mongoTemplate;

    public MongoIndexInitializer(MongoTemplate mongoTemplate) {
        this.mongoTemplate = mongoTemplate;
    }

    @EventListener(ContextRefreshedEvent.class)
    public void createIndexes() {
        IndexOperations indexes = mongoTemplate.indexOps(LogDataMng.class);

        indexes.ensureIndex(
                new Index()
                        .on("executionId", Sort.Direction.ASC)
                        .on("flowId", Sort.Direction.ASC)
                        .on("indexPath", Sort.Direction.ASC)
                        .named("execution_flow_index_path_idx")
        );

        indexes.ensureIndex(
                new Index()
                        .on("connectionId", Sort.Direction.ASC)
                        .named("connection_id_idx")
        );
    }
}
