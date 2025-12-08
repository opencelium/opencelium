package com.becon.opencelium.backend.versionmanager.backup;

import com.becon.opencelium.backend.constant.props.OpenceliumProps;
import org.bson.Document;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.data.mongodb.core.MongoTemplate;
import org.springframework.stereotype.Service;

import java.util.Arrays;

@Service
public class MongoDbBackupService {

    private static final Logger log = LoggerFactory.getLogger(MongoDbBackupService.class);
    private static final String CONNECTION_COLLECTION = "connection";
    private static final String FIELD_BINDING_COLLECTION = "field_binding";
    private static final String METHOD_COLLECTION = "method";
    private static final String OPERATOR_COLLECTION = "operator";

    private final MongoTemplate mongoTemplate;
    private final OpenceliumProps ocProps;

    public MongoDbBackupService(MongoTemplate mongoTemplate, OpenceliumProps ocProps) {
        this.mongoTemplate = mongoTemplate;
        this.ocProps = ocProps;
    }

    //TODO: instead of early dropping use create-drop-rename approach
    public void backup() {
        try {
            String connectionBackupCollection = buildBackupName(CONNECTION_COLLECTION);
            String fbBackupCollection = buildBackupName(FIELD_BINDING_COLLECTION);
            String methodBackupCollection = buildBackupName(METHOD_COLLECTION);
            String operatorBackupCollection = buildBackupName(OPERATOR_COLLECTION);

            if (mongoTemplate.collectionExists(connectionBackupCollection)) {
                mongoTemplate.dropCollection(connectionBackupCollection);
            }
            if (mongoTemplate.collectionExists(fbBackupCollection)) {
                mongoTemplate.dropCollection(fbBackupCollection);
            }
            if (mongoTemplate.collectionExists(methodBackupCollection)) {
                mongoTemplate.dropCollection(methodBackupCollection);
            }
            if (mongoTemplate.collectionExists(operatorBackupCollection)) {
                mongoTemplate.dropCollection(operatorBackupCollection);
            }

            copyCollection(CONNECTION_COLLECTION, connectionBackupCollection);
            copyCollection(FIELD_BINDING_COLLECTION, fbBackupCollection);
            copyCollection(METHOD_COLLECTION, methodBackupCollection);
            copyCollection(OPERATOR_COLLECTION, operatorBackupCollection);
        } catch (Exception e) {
            log.error("Failed to backup. Skipped updating connections");
            throw new RuntimeException(e);
        }
    }

    private String buildBackupName(String name) {
        return name + "_backup_v" + ocProps.getVersion().replace('.', '_');
    }

    public void restore() {
        restoreCollection(CONNECTION_COLLECTION);
        restoreCollection(FIELD_BINDING_COLLECTION);
        restoreCollection(METHOD_COLLECTION);
        restoreCollection(OPERATOR_COLLECTION);
    }

    private void copyCollection(String source, String destination) {
        mongoTemplate.getDb().getCollection(source)
                .aggregate(Arrays.asList(
                        new Document("$match", new Document()),  // Select all documents
                        new Document("$out", destination)))     // Output to destination
                .toCollection();
    }

    private void restoreCollection(String collectionName) {
        String backupName = buildBackupName(collectionName);

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
