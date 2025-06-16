package com.becon.opencelium.backend.database.mongodb.repository;

import com.becon.opencelium.backend.database.mongodb.entity.LogData;
import org.springframework.data.mongodb.repository.MongoRepository;
import org.springframework.data.mongodb.repository.Query;

import java.util.Optional;

public interface MetaDataLogRepository extends MongoRepository<LogData, String> {
    Optional<LogData> findByConnectionIdAndExecutionIdAndFlowchartIdAndIndexPath(
            Long connectionId, String executionId, String flowchartId, String indexPath
    );

    @Query("""
        {
            'connectionId': ?0,
            'executionId': ?1,
            'flowchartId': ?2,
            'indexPath': ?3,
            'properties.loopIndex': ?4
        }
    """)
    Optional<LogData> findByExecutionConnectionFlowchartIndexPathAndLoopIndex(
            Long connectionId,
            String executionId,
            String flowchartId,
            String indexPath,
            String loopIndex
    );
}
