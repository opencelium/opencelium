package com.becon.opencelium.backend.execution.logger.service;

import com.becon.opencelium.backend.database.mongodb.entity.LogData;
import com.becon.opencelium.backend.database.mongodb.repository.MetaDataLogRepository;
import com.becon.opencelium.backend.execution.logger.dto.LogDataDTO;
import com.becon.opencelium.backend.execution.logger.enums.PhaseCategory;
import com.becon.opencelium.backend.execution.logger.enums.PhaseType;
import com.becon.opencelium.backend.execution.logger.keys.LogLineKey;
import com.becon.opencelium.backend.execution.logger.mapper.LogDataMapper;
import com.becon.opencelium.backend.execution.logger.parser.entity.ParsedLogLine;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import java.time.Instant;
import java.util.LinkedHashMap;
import java.util.Map;
import java.util.Optional;
import java.util.Set;

/**
 * LogMetaDataServiceImp handles persistence and enrichment of parsed execution blocks (e.g. IF, LOOP, METHOD).
 */
@Service
public class LogMetaDataServiceImp implements LogMetaDataService {
    // Fields commonly known and excluded from "properties"
    private static final Set<LogLineKey> EXCLUDED_KEYS = Set.of(
            LogLineKey.TIMESTAMP,
            LogLineKey.LOG_LEVEL,
            LogLineKey.MESSAGE,
            LogLineKey.SEGMENT,
            LogLineKey.PHASE,
            LogLineKey.INDEX_PATH,
            LogLineKey.FLOWCHART_ID
    );

    @Autowired
    private MetaDataLogRepository metaDataLogRepository;

    @Autowired
    private LogDataMapper logDataMapper;

    /**
     * Saves a new block document for a *_START log line.
     * Sets the creation timestamp and persists it to MongoDB.
     *
     * @param block the parsed block metadata to store
     */
    @Override
    public void saveNewBlock(LogData block) {
        block.setCreatedAt(Instant.now());
        metaDataLogRepository.save(block);
    }

    /**
     * Updates the corresponding block document with the *_END offset.
     * Looks up the existing document by 4 keys: executionId, connectionId, flowchartId, indexPath.
     * Sets the endOffset using the block's startOffset (which was passed as the END line's offset).
     *
     * @param block the END block (only startOffset contains the correct ending offset)
     */
    @Override
    public void updateExistingBlock(LogData block) {
        Optional<LogData> existing = findExistingBlock(block);
        if (existing.isEmpty()) {
            // fallback: either log, throw, or insert as new
            block.setCreatedAt(Instant.now());
            metaDataLogRepository.save(block);
            return;
        }

        LogData dbBlock = existing.get();
        dbBlock.setEndOffset(block.getStartOffset());
        dbBlock.setStatus(block.getStatus());
        metaDataLogRepository.save(dbBlock);
    }

    @Override
    public void save(LogData block) {
        switch (block.getStatus()) {
            case PENDING -> saveNewBlock(block);
            case COMPLETE, FAIL -> updateExistingBlock(block);
            default -> throw new IllegalStateException(
                    "Unexpected status: " + block.getStatus()
            );
        }
    }

    @Override
    public Optional<LogDataDTO> toDto(LogData logData) {
        return Optional.of(logDataMapper.toDto(logData));
    }

    /**
     * Converts a ParsedLogLine into a MongoDB document, enriching it with execution context.
     * Only sets startOffset — endOffset must be handled separately during *_END updates.
     *
     * @param line the structured log line
     * @param executionId the current execution ID
     * @param connectionId the originating system ID
     * @param flowchartId the current flowchart context
     * @return the enriched document ready to persist
     */
    @Override
    public LogData fromParsedLogLine(ParsedLogLine line, String executionId,
                                     Long connectionId, String flowchartId) {
        LogData doc = new LogData();

        doc.setExecutionId(executionId);
        doc.setConnectionId(connectionId);
        doc.setFlowId(flowchartId);

        doc.setIndexPath(line.getProperties().get(LogLineKey.INDEX_PATH));
        doc.setStartOffset(line.getOffset());

        doc.setLogLineType(line.getType());
        doc.setType(PhaseCategory.fromValue((PhaseType) line.getStage()));

        // Include all other unknown fields in the 'properties' map
        Map<LogLineKey, Object> props = new LinkedHashMap<>();
        for (Map.Entry<LogLineKey, String> entry : line.getProperties().entrySet()) {
            if (!EXCLUDED_KEYS.contains(entry.getKey())) {
                props.put(entry.getKey(), entry.getValue());
            }
        }

        doc.setProperties(props);
        doc.setCreatedAt(Instant.now());
        return doc;
    }

    // --------------------------------------- Private Functions ----------------------------------------------
    private Optional<LogData> findExistingBlock(LogData block) {
        if (block.getProperties().containsKey(LogLineKey.LOOP_INDEX)) {
            return metaDataLogRepository.findByExecutionConnectionFlowIdIndexPathAndLoopIndex(
                    block.getConnectionId(),
                    block.getExecutionId(),
                    block.getFlowId(),
                    block.getIndexPath(),
                    block.getProperties().get(LogLineKey.LOOP_INDEX).toString()
            );
        } else {
            return metaDataLogRepository.findByConnectionIdAndExecutionIdAndFlowIdAndIndexPath(
                    block.getConnectionId(),
                    block.getExecutionId(),
                    block.getFlowId(),
                    block.getIndexPath()
            );
        }
    }
}
