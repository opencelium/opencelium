package com.becon.opencelium.backend.database.mongodb.repository;

import com.becon.opencelium.backend.database.mongodb.entity.ParsedLogBlockDocument;
import org.springframework.data.mongodb.repository.MongoRepository;

import java.util.Optional;

public interface ParsedLogBlockRepository extends MongoRepository<ParsedLogBlockDocument, String> {
    Optional<ParsedLogBlockDocument> findByConnectionIdAndExecutionIdAndFlowchartIdAndIndexPath(
            Long connectionId, String executionId, Integer flowchartId, String indexPath
    );
}
