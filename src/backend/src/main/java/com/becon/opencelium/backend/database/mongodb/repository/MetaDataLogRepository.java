package com.becon.opencelium.backend.database.mongodb.repository;

import com.becon.opencelium.backend.database.mongodb.entity.LogDataMng;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;
import org.springframework.data.mongodb.repository.MongoRepository;
import org.springframework.data.mongodb.repository.Query;

import java.util.List;
import java.util.Optional;

public interface MetaDataLogRepository extends MongoRepository<LogDataMng, String> {
    Optional<LogDataMng> findByConnectionIdAndExecutionIdAndFlowIdAndIndexPath(
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
    Optional<LogDataMng> findByExecutionConnectionFlowIdIndexPathAndLoopIndex(
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
    List<LogDataMng> findChildren(String executionId, String type, Sort sort);

    @Query("""
        {
            'executionId': ?0,
            'flowId': ?1,
            'indexPath': { $regex: ?2 }
        }
    """)
    List<LogDataMng> findChildren(String executionId, String flowId, String regex, Sort sort);

    @Query("""
        {
            'executionId': ?0,
            'flowId': ?1,
            'indexPath': { $regex: ?2 },
            'properties.loopIndex': ?3
        }
    """)
    List<LogDataMng> findChildren(String executionId, String flowId, String regex, String loopIndex, Sort sort);

    /**
     * Finds the descendants of a block that lie inside the block's own byte range.
     * <p>
     * The {@code indexPath} regex alone matches descendants of every loop iteration, so the offset
     * window is what actually restricts the result to the children of one concrete block. Pass a
     * {@code Pageable} sorted by {@code startOffset} ASC (or {@code endOffset} DESC) with page size 1
     * to get the first (or last) descendant.
     *
     * @param executionId       execution the block belongs to
     * @param flowId            flowchart the block belongs to
     * @param indexPathRegex    regex matching the descendants' index paths
     * @param parentStartOffset first byte of the parent block
     * @param parentEndOffset   first byte after the parent block
     * @param pageable          sort order and page size of the result
     */
    @Query("""
        {
            'executionId': ?0,
            'flowId': ?1,
            'indexPath': { $regex: ?2 },
            'startOffset': { $gte: ?3 },
            'endOffset': { $lte: ?4 }
        }
    """)
    List<LogDataMng> findDescendantsInOffsetRange(
            String executionId,
            String flowId,
            String indexPathRegex,
            long parentStartOffset,
            long parentEndOffset,
            Pageable pageable
    );

    /**
     * Finds the children of a given type that lie inside a block's own byte range.
     * <p>
     * Used for blocks whose children cannot be matched by index path — an EXECUTION block owns
     * FLOWCHART blocks, and neither of them carries one.
     *
     * @param executionId       execution the block belongs to
     * @param type              {@link com.becon.opencelium.backend.execution.logger.enums.PhaseCategory} name of the children
     * @param parentStartOffset first byte of the parent block
     * @param parentEndOffset   first byte after the parent block
     * @param pageable          sort order and page size of the result
     */
    @Query("""
        {
            'executionId': ?0,
            'type': ?1,
            'startOffset': { $gte: ?2 },
            'endOffset': { $lte: ?3 }
        }
    """)
    List<LogDataMng> findChildrenInOffsetRange(
            String executionId,
            String type,
            long parentStartOffset,
            long parentEndOffset,
            Pageable pageable
    );

    Optional<LogDataMng> findByExecutionIdAndType(String executionId, String type);
    Optional<LogDataMng> findByFlowIdAndType(String executionId, String type);

    boolean existsByExecutionIdAndType(String executionId, String type);

    long deleteAllByConnectionId(Long connectionId);
}
