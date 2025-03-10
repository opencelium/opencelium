package com.becon.opencelium.backend.version_manager.backup;

import org.bson.Document;
import org.springframework.data.mongodb.core.MongoTemplate;
import org.springframework.stereotype.Service;
import java.util.Arrays;

@Service
public class MongoDbBackupService {

    private static final String CONNECTION_COLLECTION = "connection";
    private static final String FIELD_BINDING_COLLECTION = "field_binding";
    private static final String METHOD_COLLECTION = "method";
    private static final String OPERATOR_COLLECTION = "operator";

    private final MongoTemplate mongoTemplate;

    public MongoDbBackupService(MongoTemplate mongoTemplate) {
        this.mongoTemplate = mongoTemplate;
    }

    /**
     * Creates backups for all collections.
     */
    public void backup() {
        copyCollection(CONNECTION_COLLECTION, CONNECTION_COLLECTION + "_backup");
        copyCollection(FIELD_BINDING_COLLECTION, FIELD_BINDING_COLLECTION + "_backup");
        copyCollection(METHOD_COLLECTION, METHOD_COLLECTION + "_backup");
        copyCollection(OPERATOR_COLLECTION, OPERATOR_COLLECTION + "_backup");
    }

    /**
     * Restores all collections from their backups and deletes the backups.
     */
    public void restore() {
        restoreCollection(CONNECTION_COLLECTION);
        restoreCollection(FIELD_BINDING_COLLECTION);
        restoreCollection(METHOD_COLLECTION);
        restoreCollection(OPERATOR_COLLECTION);
    }

    /**
     * Copies data from one collection to another.
     */
    private void copyCollection(String source, String destination) {
        mongoTemplate.getDb().getCollection(source)
                .aggregate(Arrays.asList(
                        new Document("$match", new Document()),  // Select all documents
                        new Document("$out", destination)))     // Output to destination
                .toCollection();
    }

    private void restoreCollection(String collectionName) {
        String backupName = collectionName + "_backup";

        // Ensure the backup collection exists before restoring
        if (mongoTemplate.getDb().getCollection(backupName).countDocuments() == 0) {
            return;
        }

        // Step 1: Remove all existing documents from the collection
        mongoTemplate.getDb().getCollection(collectionName).deleteMany(new Document());

        // Step 2: Copy backup data back to the original collection
        copyCollection(backupName, collectionName);
    }

}
