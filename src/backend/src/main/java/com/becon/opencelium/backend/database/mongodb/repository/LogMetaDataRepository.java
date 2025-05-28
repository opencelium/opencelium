package com.becon.opencelium.backend.database.mongodb.repository;

import com.becon.opencelium.backend.database.mongodb.entity.LogMetaData;
import org.springframework.data.mongodb.repository.MongoRepository;
import org.springframework.data.mongodb.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface LogMetaDataRepository extends MongoRepository<LogMetaData, String> {
    List<LogMetaData> findByExecutionIdAndIndexPathRegex(String executionId, String regex);

    Optional<LogMetaData> findFirstByExecutionIdAndFlowchartIdAndIndexPath(String executionId, String connectorId, String indexPath);

    @Query("{ 'executionId': :#{#executionId}, 'flowchartId': :#{#flowchartId}, 'parentPath': { $regex: :#{#parentPath} }, " +
            "$or: [ " +
            "  { $expr: { $eq: [:#{#loopIndex}, null] } }, " +
            "  { $and: [ " +
            "    { 'meta': { $ne: null } }, " +
            "    { 'meta.loopIndex': :#{#loopIndex} } " +
            "  ] } " +
            "] }")
    List<LogMetaData> findByExecutionIdAndFlowchartIdAndParentPathAndLoopIndex(
            @Param("executionId") String executionId,
            @Param("flowchartId") String flowchartId,
            @Param("parentPath") String parentPath,
            @Param("loopIndex") String loopIndex
    );
}