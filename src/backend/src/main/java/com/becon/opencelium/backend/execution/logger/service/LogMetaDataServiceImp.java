package com.becon.opencelium.backend.execution.logger.service;

import com.becon.opencelium.backend.database.mongodb.entity.LogMetaData;
import com.becon.opencelium.backend.database.mongodb.repository.MetaDataLogRepository;
import com.becon.opencelium.backend.execution.logger.parser.entity.ParsedLogLine;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import java.time.Instant;
import java.util.LinkedHashMap;
import java.util.Map;
import java.util.Optional;

/**
 * LogMetaDataServiceImp handles persistence and enrichment of parsed execution blocks (e.g. IF, LOOP, METHOD).
 */
@Service
public class LogMetaDataServiceImp implements LogMetaDataService {

    @Autowired
    private MetaDataLogRepository metaDataLogRepository;

    /**
     * Saves a new block document for a *_START log line.
     * Sets the creation timestamp and persists it to MongoDB.
     *
     * @param block the parsed block metadata to store
     */
    @Override
    public void saveStartBlock(LogMetaData block) {
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
    public void updateEndOffset(LogMetaData block) {
        Optional<LogMetaData> optional;
        if (block.getProperties().containsKey("loopIndex")) {
            optional = metaDataLogRepository.findByExecutionConnectionFlowchartIndexPathAndLoopIndex(
                    block.getConnectionId(),
                    block.getExecutionId(),
                    block.getFlowchartId(),
                    block.getIndexPath(),
                    block.getProperties().get("loopIndex").toString()
            );
        } else {
            optional = metaDataLogRepository.findByConnectionIdAndExecutionIdAndFlowchartIdAndIndexPath(
                    block.getConnectionId(),
                    block.getExecutionId(),
                    block.getFlowchartId(),
                    block.getIndexPath()
            );
        }

        optional.ifPresent(b -> {
            // only StartOffset are initialized during mapping from ParsedLogLine to ParsedLogBlockDocument
            b.setEndOffset(block.getStartOffset());
            metaDataLogRepository.save(b);
        });
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
    public LogMetaData fromParsedLogLine(ParsedLogLine line, String executionId,
                                         Long connectionId, int flowchartId) {
        LogMetaData doc = new LogMetaData();

        doc.setExecutionId(executionId);
        doc.setConnectionId(connectionId);
        doc.setFlowchartId(flowchartId);

        doc.setIndexPath(line.getIndexPath());
        doc.setStartOffset(line.getOffset());

        doc.setLogLineType(line.getLogLineType());
        doc.setValue(line.getValue());

        // Copy properties as-is for now (can be enhanced for nested structures)
        Map<String, Object> props = new LinkedHashMap<>();
        if (line.getProperties() != null) {
            props.putAll(line.getProperties());
        }
        doc.setProperties(props);
        doc.setCreatedAt(Instant.now());
        return doc;
    }
}
