package com.becon.opencelium.backend.execution.logger.service;

import com.becon.opencelium.backend.database.mongodb.entity.LogData;
import com.becon.opencelium.backend.database.mongodb.repository.MetaDataLogRepository;
import com.becon.opencelium.backend.execution.logger.dto.LogDataDTO;
import com.becon.opencelium.backend.execution.logger.enums.LogDetailLevel;
import com.becon.opencelium.backend.execution.logger.enums.PhaseCategory;
import com.becon.opencelium.backend.execution.logger.enums.PhaseType;
import com.becon.opencelium.backend.execution.logger.keys.LogLineKey;
import com.becon.opencelium.backend.execution.logger.mapper.LogDataMapper;
import com.becon.opencelium.backend.execution.logger.parser.FlexiblePatternLogParser;
import com.becon.opencelium.backend.execution.logger.parser.ParsedLogLineBuilder;
import com.becon.opencelium.backend.execution.logger.parser.entity.ParsedLogLine;
import com.becon.opencelium.backend.execution.logger.tracker.ExecutionTracker;
import com.becon.opencelium.backend.execution.logger.tracker.ExecutionTrackerImpl;
import org.bson.types.ObjectId;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.data.domain.Sort;
import org.springframework.stereotype.Service;

import java.time.Instant;
import java.util.ArrayList;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;
import java.util.Optional;
import java.util.Set;
import java.util.regex.Pattern;

import static com.becon.opencelium.backend.execution.logger.enums.PhaseCategory.FLOWCHART;
import static com.becon.opencelium.backend.execution.logger.enums.PhaseCategory.OPERATION;

/**
 * LogMetaDataServiceImp handles persistence and enrichment of parsed execution blocks (e.g. IF, LOOP, METHOD).
 */
@Service
public class LogDataServiceImp implements LogDataService {
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
    private static final Sort SORT_ASCENDING = Sort.by(Sort.Direction.ASC, "createdAt");
    private static final Sort SORT_DESCENDING = Sort.by(Sort.Direction.DESC, "createdAt");

    @Autowired
    private MetaDataLogRepository metaDataLogRepository;

    @Autowired
    private FlexiblePatternLogParser flexiblePatternLogParser;

    @Autowired
    private LogDataMapper logDataMapper;

    @Autowired
    private ParsedLogLineBuilder parsedLogLineBuilder;

    @Override
    public List<LogDataDTO> getChildrenById(String elementId, String loopIndex) {
        LogData entity = findByIdElseThrow(elementId);

        List<LogData> children = switch (entity.getType()) {
            case EXECUTION -> executionChildren(entity);
            case FLOWCHART -> flowchartChildren(entity);
            case IF -> ifChildren(entity);
            case LOOP -> loopChildren(entity, loopIndex);
            default -> List.of();
        };

        return children.stream()
                .map(logDataMapper::toDto)
                .toList();
    }

    @Override
    public LogDataDTO getDetailsById(String elementId) {
        LogData entity = findByIdElseThrow(elementId);

        PhaseCategory type = entity.getType();

        String executionId = entity.getExecutionId();
        Long connectionId = entity.getConnectionId();
        String flowchartId = entity.getFlowId();
        long startOffset = entity.getStartOffset();
        long endOffset = entity.getEndOffset();

        List<String> lines = new ArrayList<>();
        if (type == FLOWCHART) {
            return logDataMapper.toDto(entity);
        } else if (type == OPERATION) {
            lines.addAll(flexiblePatternLogParser.readLines(executionId, startOffset, endOffset));
        } else {
            // for IF and LOOP remove its children before parsing
            String indexPath = entity.getIndexPath();
            String safeParent = Pattern.quote(indexPath);
            String regex = "^" + safeParent + "_[0-9]+(_[0-9]+)*$"; // filters all-level children

            Optional<LogData> firstChild = metaDataLogRepository.findFirstByExecutionIdAndFlowIdAndIndexPathRegex(
                    executionId, flowchartId, regex, SORT_ASCENDING
            );
            Optional<LogData> lastChild = metaDataLogRepository.findFirstByExecutionIdAndFlowIdAndIndexPathRegex(
                    executionId, flowchartId, regex, SORT_DESCENDING
            );
            if (firstChild.isPresent() && lastChild.isPresent()) {
                long firstChildStartOffset = firstChild.get().getStartOffset();
                long lastChildEndOffset = lastChild.get().getEndOffset();

                lines.addAll(flexiblePatternLogParser.readLines(executionId, startOffset, firstChildStartOffset));
                lines.addAll(flexiblePatternLogParser.readLines(executionId, lastChildEndOffset, endOffset));
            } else {
                lines.addAll(flexiblePatternLogParser.readLines(executionId, startOffset, endOffset));
            }
        }

        LogData collected = collect(lines, executionId, connectionId, flowchartId);

        // populate additional fields from 'entity'
        collected.setId(entity.getId());
        collected.setConnectionId(entity.getConnectionId());
        collected.setExecutionId(entity.getExecutionId());
        collected.setFlowId(entity.getFlowId());
        collected.setConnectorName(entity.getConnectorName());
        collected.setStatus(entity.getStatus());
        collected.setIndexPath(entity.getIndexPath());
        collected.setLogLineType(entity.getLogLineType());
        collected.setType(entity.getType());

        return logDataMapper.toDto(collected);
    }

    /**
     * Saves a new block document for a *_START log line.
     * Sets the creation timestamp and persists it to MongoDB.
     *
     * @param block the parsed block metadata to store
     */
    @Override
    public void saveNewBlock(LogData block) {
        String id = new ObjectId().toHexString();
        block.setId(id);
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
        dbBlock.setEndOffset(block.getEndOffset());
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
        doc.setStartOffset(line.getStartOffset());
        doc.setEndOffset(line.getEndOffset());

        doc.setLogLineType(line.getType());
        doc.setType(PhaseCategory.fromValue((PhaseType) line.getStage()));

        // Include all other unknown fields in the 'properties' map
        Map<String, Object> props = new LinkedHashMap<>();
        for (Map.Entry<LogLineKey, String> entry : line.getProperties().entrySet()) {
            if (!EXCLUDED_KEYS.contains(entry.getKey())) {
                props.put(entry.getKey().name(), entry.getValue());
            }
        }

        doc.setProperties(props);
        doc.setCreatedAt(Instant.now());
        return doc;
    }

    // --------------------------------------- Private Functions ----------------------------------------------
    private Optional<LogData> findExistingBlock(LogData block) {
        if (block.getProperties().containsKey(LogLineKey.LOOP_INDEX.getSrcName())) {
            return metaDataLogRepository.findByExecutionConnectionFlowIdIndexPathAndLoopIndex(
                    block.getConnectionId(),
                    block.getExecutionId(),
                    block.getFlowId(),
                    block.getIndexPath(),
                    block.getProperties().get(LogLineKey.LOOP_INDEX.getSrcName()).toString()
            );
        }
        return metaDataLogRepository.findByConnectionIdAndExecutionIdAndFlowIdAndIndexPath(
                block.getConnectionId(),
                block.getExecutionId(),
                block.getFlowId(),
                block.getIndexPath()
        );
    }

    private LogData findByIdElseThrow(String phaseId) {
        return metaDataLogRepository.findById(phaseId)
                .orElseThrow(() -> new RuntimeException("LogData element not found with specified id = " + phaseId));
    }

    private LogData collect(List<String> lines, String executionId, Long connectionId,String flowchartId) {
        ExecutionTracker tracker = new ExecutionTrackerImpl(executionId, connectionId.toString(), flowchartId, LogDetailLevel.DETAILED);

        ParsedLogLine parsed;
        Optional<LogData> result = Optional.empty();
        for (String line : lines) {
            parsed = parsedLogLineBuilder.build(line);
            result = tracker.buildLogData(parsed);

            if (result.isPresent()) break;
        }

        return result.orElseGet(LogData::new);
    }

    private List<LogData> executionChildren(LogData entity) {
        String executionId = entity.getExecutionId();

        return metaDataLogRepository.findChildren(executionId, FLOWCHART.name(), SORT_ASCENDING);
    }

    private List<LogData> flowchartChildren(LogData entity) {
        String executionId = entity.getExecutionId();
        String flowchartId = entity.getFlowId();
        String regex = "^[0-9]+$"; // filters only numbers (first level children)

        return metaDataLogRepository.findChildren(executionId, flowchartId, regex, SORT_ASCENDING);
    }

    private List<LogData> ifChildren(LogData entity) {
        String executionId = entity.getExecutionId();
        String flowchartId = entity.getFlowId();
        String indexPath = entity.getIndexPath();
        String regex = "^" + Pattern.quote(indexPath) + "_[0-9]+$"; // filters only first-level children
        String nearestLoopIndex = (String) entity.getProperties().getOrDefault("loopIndex", "");

        if (nearestLoopIndex.isBlank()) {
            // IF is outside any LOOP
            return metaDataLogRepository.findChildren(executionId, flowchartId, regex, SORT_ASCENDING);
        } else {
            return metaDataLogRepository.findChildren(executionId, flowchartId, regex, nearestLoopIndex, SORT_ASCENDING);
        }
    }

    private List<LogData> loopChildren(LogData entity, String loopIndex) { // default loopIndex = 0
        String executionId = entity.getExecutionId();
        String flowchartId = entity.getFlowId();
        String indexPath = entity.getIndexPath();
        String regex = "^" + Pattern.quote(indexPath) + "_[0-9]+$"; // filters only first-level children

        String nearestLoopIndex = (String) entity.getProperties().getOrDefault("loopIndex", "");
        String currentLoopIndex = nearestLoopIndex.isBlank() ? loopIndex : nearestLoopIndex + "," + loopIndex;

        return metaDataLogRepository.findChildren(executionId, flowchartId, regex, currentLoopIndex, SORT_ASCENDING);
    }
}
