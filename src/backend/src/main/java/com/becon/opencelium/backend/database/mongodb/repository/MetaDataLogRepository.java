package com.becon.opencelium.backend.database.mongodb.repository;

import com.becon.opencelium.backend.database.mongodb.entity.LogData;
import org.springframework.data.domain.Sort;
import org.springframework.data.mongodb.repository.MongoRepository;
import org.springframework.data.mongodb.repository.Query;

import java.util.List;
import java.util.Optional;

public interface MetaDataLogRepository extends MongoRepository<LogData, String> {
    Optional<LogData> findByConnectionIdAndExecutionIdAndFlowIdAndIndexPath(
            Long connectionId, String executionId, String flowchartId, String indexPath
    );

    @Query("""
        {
            'connectionId': ?0,
            'executionId': ?1,
            'flowId': ?2,
            'indexPath': ?3,
            'properties.loopIndex': ?4
        }
    """)
    Optional<LogData> findByExecutionConnectionFlowIdIndexPathAndLoopIndex(
            Long connectionId,
            String executionId,
            String flowId,
            String indexPath,
            String loopIndex
    );

    @Query("""
        {
            'executionId': ?0,
            'type': ?1
        }
    """)
    List<LogData> findChildren(String executionId, String type, Sort sort);

    @Query("""
        {
            'executionId': ?0,
            'flowId': ?1,
            'indexPath': { $regex: ?2 }
        }
    """)
    List<LogData> findChildren(String executionId, String flowId, String regex, Sort sort);

    @Query("""
        {
            'executionId': ?0,
            'flowId': ?1,
            'indexPath': { $regex: ?2 },
            'properties.loopIndex': ?3
        }
    """)
    List<LogData> findChildren(String executionId, String flowId, String regex, String loopIndex, Sort sort);
}
