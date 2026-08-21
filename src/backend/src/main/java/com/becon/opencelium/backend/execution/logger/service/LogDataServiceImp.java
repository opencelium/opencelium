package com.becon.opencelium.backend.execution.logger.service;

import com.becon.opencelium.backend.database.mongodb.entity.LogDataMng;
import com.becon.opencelium.backend.database.mongodb.repository.MetaDataLogRepository;
import com.becon.opencelium.backend.execution.logger.buffer.InMemoryLogBlockBuffer;
import com.becon.opencelium.backend.execution.logger.buffer.LogBlockBuffer;
import com.becon.opencelium.backend.execution.logger.dto.LogDataDTO;
import com.becon.opencelium.backend.execution.logger.enums.LogDetailLevel;
import com.becon.opencelium.backend.execution.logger.enums.PhaseCategory;
import com.becon.opencelium.backend.execution.logger.enums.PhaseStatus;
import com.becon.opencelium.backend.execution.logger.enums.PhaseType;
import com.becon.opencelium.backend.execution.logger.keys.LogLineKey;
import com.becon.opencelium.backend.execution.logger.mapper.LogDataMapper;
import com.becon.opencelium.backend.execution.logger.parser.FlexiblePatternLogParser;
import com.becon.opencelium.backend.execution.logger.parser.ParsedLogLineBuilder;
import com.becon.opencelium.backend.execution.logger.parser.entity.ParsedLogLine;
import com.becon.opencelium.backend.execution.logger.tracker.ExecutionTracker;
import com.becon.opencelium.backend.execution.logger.tracker.ExecutionTrackerImpl;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;
import org.springframework.stereotype.Service;

import java.time.Instant;
import java.util.ArrayList;
import java.util.Comparator;
import java.util.HashMap;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;
import java.util.Objects;
import java.util.Optional;
import java.util.Set;
import java.util.regex.Pattern;

import static com.becon.opencelium.backend.execution.logger.enums.PhaseCategory.EXECUTION;
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

    /** Selects the child that opens first, and the one that closes last, of a single block. */
    private static final Pageable FIRST_BY_START_OFFSET =
            PageRequest.of(0, 1, Sort.by(Sort.Direction.ASC, "startOffset"));
    private static final Pageable LAST_BY_END_OFFSET =
            PageRequest.of(0, 1, Sort.by(Sort.Direction.DESC, "endOffset"));

    private static final int BATCH_SIZE = 10000;
    // buffer of blocks waiting to be flushed
    // in-memory index so findExistingBlock can see buffered items
    // key = connectionId|executionId|flowId|indexPath|loopIndex?
    private final Map<String, LogDataMng> bufferIndex = new HashMap<>();

    @Autowired
    private MetaDataLogRepository metaDataLogRepository;

    @Autowired
    private FlexiblePatternLogParser flexiblePatternLogParser;

    @Autowired
    private LogDataMapper logDataMapper;

    @Autowired
    private ParsedLogLineBuilder parsedLogLineBuilder;

    private final LogBlockBuffer buffer = new InMemoryLogBlockBuffer(
            BATCH_SIZE,
            this::buildKey // use method reference as key extractor
    );

    @Override
    public List<LogDataDTO> getChildrenById(String elementId, String loopIndex) {
        String id = findElementId(elementId);
        LogDataMng entity = findByIdElseThrow(id);

        List<LogDataMng> children = switch (entity.getType()) {
            case EXECUTION -> executionChildren(entity);
            case FLOWCHART -> flowchartChildren(entity);
            case IF        -> ifChildren(entity);
            case LOOP      -> loopChildren(entity, loopIndex);
            default        -> List.of();
        };

        Comparator<LogDataMng> byIndexPathNumeric = (a, b) -> compareIndexPath(a.getIndexPath(), b.getIndexPath());
        Comparator<LogDataMng> byStartOffset     = Comparator.comparing(
                LogDataMng::getStartOffset,
                Comparator.nullsLast(Long::compareTo)
        );

        return children.stream()
                .sorted(byIndexPathNumeric.thenComparing(byStartOffset))
                .map(logDataMapper::toDto)
                .toList();
    }

    /** Compares indexPath strings like "0_10_2" numerically as [0,10,2]. */
    private static int compareIndexPath(String a, String b) {
        List<Integer> la = parseIndexPath(a);
        List<Integer> lb = parseIndexPath(b);
        int n = Math.min(la.size(), lb.size());
        for (int i = 0; i < n; i++) {
            int c = Integer.compare(la.get(i), lb.get(i));
            if (c != 0) return c;
        }
        // If all compared parts equal, shorter path comes first
        return Integer.compare(la.size(), lb.size());
    }

    /** Splits on non-digits and parses integers; null/blank -> empty list. */
    private static List<Integer> parseIndexPath(String s) {
        if (s == null || s.isBlank()) return List.of();
        String[] parts = s.split("\\D+"); // split on non-digits (e.g., underscore)
        List<Integer> out = new ArrayList<>(parts.length);
        for (String p : parts) {
            if (!p.isEmpty()) out.add(Integer.parseInt(p));
        }
        return out;
    }

    // sometime user can send id of execution in such cases we have to find elementId.
    private String findElementId(String elementId) {
        return metaDataLogRepository.findByExecutionIdAndType(elementId, EXECUTION.name())
                .map(LogDataMng::getId)
                .orElse(elementId);
    }

    @Override
    public LogDataDTO getDetailsById(String elementId) {
        LogDataMng entity = findByIdElseThrow(elementId);

        PhaseCategory type = entity.getType();

        String executionId = entity.getExecutionId();
        Long connectionId = entity.getConnectionId();
        String flowchartId = entity.getFlowId();
        long startOffset = entity.getStartOffset();
        long endOffset = entity.getEndOffset();

        if (type == FLOWCHART) {
            return logDataMapper.toDto(entity);
        }

        List<String> lines = type == OPERATION
                // an OPERATION owns no children, its whole block belongs to it
                ? flexiblePatternLogParser.readLines(executionId, startOffset, endOffset)
                // for EXECUTION, IF and LOOP read the block around its children
                : readAroundChildren(entity, executionId, flowchartId, startOffset, endOffset);

        LogDataMng collected = collect(lines, executionId, connectionId, flowchartId);

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
        collected.setError(entity.getError());

        return logDataMapper.toDto(collected);
    }

    /**
     * Saves a new block document for a *_START log line.
     * Sets the creation timestamp and persists it to MongoDB.
     *
     * @param block the parsed block metadata to store
     */
    @Override
    public void saveNewBlock(LogDataMng block) {
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
    public void updateExistingBlock(LogDataMng block) {
        Optional<LogDataMng> existing = findExistingBlock(block);
        if (existing.isEmpty()) {
            // fallback: either log, throw, or insert as new
            block.setCreatedAt(Instant.now());
            metaDataLogRepository.save(block);
            return;
        }
        block.setId(existing.get().getId());
//        LogDataMng dbBlock = existing.get();
//        dbBlock.setEndOffset(block.getEndOffset());
//        dbBlock.setStatus(block.getStatus());
        block.setCreatedAt(existing.get().getCreatedAt());
        metaDataLogRepository.save(block);
    }

    @Override
    public synchronized void save(LogDataMng block) {
        LogDataMng toPersist = prepareForPersist(block);
        // single synchronous save, without buffering
        metaDataLogRepository.save(toPersist);
    }

    /**
     * Buffer a single block; when buffer reaches BATCH_SIZE,
     * flush all to DB in one go.
     */
    @Override
    public synchronized void bufferAndFlush(LogDataMng block) {
        LogDataMng toPersist = prepareForPersist(block);

        // buffer exactly once; a non-empty result means the size threshold was reached
        List<LogDataMng> batchToFlush = new ArrayList<>(buffer.buffer(toPersist));

        if (isExecutionComplete(toPersist)) {
            // execution is over: drain whatever is still in memory (including this block,
            // unless the threshold flush above already carried it out)
            batchToFlush.addAll(buffer.flushAll());
        }

        if (!batchToFlush.isEmpty()) {
            metaDataLogRepository.saveAll(batchToFlush);
        }
    }

    public void flushBufferNow() {
        List<LogDataMng> batch = buffer.flushAll();
        if (!batch.isEmpty()) {
            long start = System.currentTimeMillis();
            metaDataLogRepository.saveAll(batch);
        }
    }

    @Override
    public boolean hasDbRecords(long execId) {
        String executionId = Long.toString(execId);

        boolean existsInBuffer = buffer.findAllByExecutionId(executionId).stream()
                .anyMatch(this::isExecutionEnd);

        boolean existsInDB = metaDataLogRepository.findByExecutionIdAndType(executionId, EXECUTION.name())
                .filter(this::isExecutionEnd)
                .isPresent();

        return existsInBuffer || existsInDB;
    }

    private boolean isExecutionEnd(LogDataMng block) {
        return block.getType() == EXECUTION
                && (block.getStatus() == PhaseStatus.COMPLETE || block.getStatus() == PhaseStatus.FAIL);
    }

    @Override
    public Optional<LogDataDTO> toDto(LogDataMng logDataMng) {
        return Optional.of(logDataMapper.toDto(logDataMng));
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
    public LogDataMng fromParsedLogLine(ParsedLogLine line, String executionId,
                                        Long connectionId, String flowchartId) {
        LogDataMng doc = new LogDataMng();

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
//    private Optional<LogDataMng> findExistingBlock(LogDataMng block) {
//        if (block.getProperties().containsKey(LogLineKey.LOOP_INDEX.getSrcName())) {
//            return metaDataLogRepository.findByExecutionConnectionFlowIdIndexPathAndLoopIndex(
//                    block.getConnectionId(),
//                    block.getExecutionId(),
//                    block.getFlowId(),
//                    block.getIndexPath(),
//                    block.getProperties().get(LogLineKey.LOOP_INDEX.getSrcName()).toString()
//            );
//        }
//        return metaDataLogRepository.findByConnectionIdAndExecutionIdAndFlowIdAndIndexPath(
//                block.getConnectionId(),
//                block.getExecutionId(),
//                block.getFlowId(),
//                block.getIndexPath()
//        );
//    }

    private LogDataMng findByIdElseThrow(String phaseId) {
        return metaDataLogRepository.findById(phaseId)
                .or(() -> metaDataLogRepository.findByExecutionIdAndType(phaseId, EXECUTION.name()))
                .or(() -> metaDataLogRepository.findByFlowIdAndType(phaseId, FLOWCHART.name()))
                .or(() -> buffer.findById(phaseId))
                .orElseThrow(() -> new RuntimeException("LogData element not found with specified id = " + phaseId));
    }

    /**
     * Reads the part of a block that belongs to the block itself: everything before its first child
     * starts and everything after its last child ends. A block with no children is read whole.
     * <p>
     * Children are located by byte range rather than by creation time, because a child document can
     * reach MongoDB before its own parent, and because the index path of an IF or LOOP child matches
     * every loop iteration — only the parent's byte range tells the iterations apart.
     */
    private List<String> readAroundChildren(LogDataMng entity, String executionId, String flowchartId,
                                            long startOffset, long endOffset) {
        Optional<LogDataMng> firstChild = findChild(entity, executionId, flowchartId, FIRST_BY_START_OFFSET);
        Optional<LogDataMng> lastChild = findChild(entity, executionId, flowchartId, LAST_BY_END_OFFSET);

        if (firstChild.isEmpty() || lastChild.isEmpty()) {
            return flexiblePatternLogParser.readLines(executionId, startOffset, endOffset);
        }

        long firstChildStartOffset = firstChild.get().getStartOffset();
        long lastChildEndOffset = lastChild.get().getEndOffset();

        List<String> lines = new ArrayList<>();
        if (startOffset < firstChildStartOffset) {
            lines.addAll(flexiblePatternLogParser.readLines(executionId, startOffset, firstChildStartOffset));
        }
        if (lastChildEndOffset < endOffset) {
            lines.addAll(flexiblePatternLogParser.readLines(executionId, lastChildEndOffset, endOffset));
        }
        return lines;
    }

    /**
     * Finds the first child of a block within the block's own byte range, in the order given by
     * {@code pageable}. An EXECUTION block owns FLOWCHART blocks, which carry no index path;
     * every other block owns the descendants whose index path extends its own.
     */
    private Optional<LogDataMng> findChild(LogDataMng entity, String executionId, String flowchartId,
                                           Pageable pageable) {
        long startOffset = entity.getStartOffset();
        long endOffset = entity.getEndOffset();

        if (entity.getType() == EXECUTION) {
            return metaDataLogRepository
                    .findChildrenInOffsetRange(executionId, FLOWCHART.name(), startOffset, endOffset, pageable)
                    .stream()
                    .findFirst();
        }

        String indexPath = entity.getIndexPath();
        if (indexPath == null || indexPath.isBlank()) {
            return Optional.empty();
        }
        String regex = "^" + Pattern.quote(indexPath) + "_[0-9]+(_[0-9]+)*$"; // filters all-level children

        return metaDataLogRepository
                .findDescendantsInOffsetRange(executionId, flowchartId, regex, startOffset, endOffset, pageable)
                .stream()
                .findFirst();
    }

    private LogDataMng collect(List<String> lines, String executionId, Long connectionId, String flowchartId) {
        ExecutionTracker tracker = new ExecutionTrackerImpl(executionId, connectionId.toString(), flowchartId, LogDetailLevel.DETAILED);

        ParsedLogLine parsed;
        Optional<LogDataMng> result = Optional.empty();
        for (String line : lines) {
            // a line the parser cannot place — a blank line, a stack trace — carries no phase or segment
            if (!parsedLogLineBuilder.supports(line)) {
                continue;
            }
            parsed = parsedLogLineBuilder.build(line);
            result = tracker.buildLogData(parsed);

            if (result.isPresent()) break;
        }

        return result.orElseGet(LogDataMng::new);
    }

    private List<LogDataMng> executionChildren(LogDataMng entity) {
        String executionId = entity.getExecutionId();

        var savedChildren = metaDataLogRepository.findChildren(executionId, FLOWCHART.name(), SORT_ASCENDING);

        var bufferedChildren = buffer.findAllByExecutionId(executionId).stream()
                .filter(child -> child.getType() == FLOWCHART)
                .toList();

        return mergeChildren(savedChildren, bufferedChildren);
    }

    private List<LogDataMng> flowchartChildren(LogDataMng entity) {
        String executionId = entity.getExecutionId();
        String flowchartId = entity.getFlowId();
        String regex = "^[0-9]+$"; // filters only numbers (first level children)

        var savedChildren = metaDataLogRepository.findChildren(executionId, flowchartId, regex, SORT_ASCENDING);

        var bufferedChildren = findBufferedChildren(executionId, flowchartId, regex, null);

        return mergeChildren(savedChildren, bufferedChildren);
    }

    private List<LogDataMng> ifChildren(LogDataMng entity) {
        String executionId = entity.getExecutionId();
        String flowchartId = entity.getFlowId();
        String indexPath = entity.getIndexPath();
        String regex = "^" + Pattern.quote(indexPath) + "_[0-9]+$"; // filters only first-level children

        var savedChildren = hasLoopIndex(entity)
                ? metaDataLogRepository.findChildren(executionId, flowchartId, regex, getLoopIndex(entity), SORT_ASCENDING)
                : metaDataLogRepository.findChildren(executionId, flowchartId, regex, SORT_ASCENDING); // IF is outside any LOOP

        var bufferedChildren = hasLoopIndex(entity)
                ? findBufferedChildren(executionId, flowchartId, regex, getLoopIndex(entity))
                : findBufferedChildren(executionId, flowchartId, regex, null);

        return mergeChildren(savedChildren, bufferedChildren);
    }

    private List<LogDataMng> loopChildren(LogDataMng entity, String loopIndex) { // default loopIndex = 0
        String executionId = entity.getExecutionId();
        String flowchartId = entity.getFlowId();
        String indexPath = entity.getIndexPath();
        String regex = "^" + Pattern.quote(indexPath) + "_[0-9]+$"; // filters only first-level children

        String currentLoopIndex = hasLoopIndex(entity)
                ? getLoopIndex(entity) + "," + loopIndex
                : loopIndex;

        var savedChildren = metaDataLogRepository.findChildren(executionId, flowchartId, regex, currentLoopIndex, SORT_ASCENDING);

        var bufferedChildren = findBufferedChildren(executionId, flowchartId, regex, currentLoopIndex);

        return mergeChildren(savedChildren, bufferedChildren);
    }

    private List<LogDataMng> findBufferedChildren(String executionId, String flowchartId, String regex, String loopIndex) {
        Pattern pattern = Pattern.compile(regex);

        return buffer.findAllByExecutionId(executionId).stream()
                .filter(child -> Objects.equals(child.getFlowId(), flowchartId))
                .filter(child -> child.getIndexPath() != null)
                .filter(child -> pattern.matcher(child.getIndexPath()).matches())
                .filter(child -> loopIndex == null || (hasLoopIndex(child) && Objects.equals(getLoopIndex(child), loopIndex)))
                .toList();
    }

    /**
     * Merges children log data elements by removing duplicated.
     * Notice. Both lists are already sorted in ascending order by 'createdDate'
     * so no need to sort here again
     *
     * @param savedChildren    - saved children, sorted in ascending order by 'createdDate'
     * @param bufferedChildren - buffered children, sorted in ascending order by 'createdDate'
     * @return list of completed children
     */
    private List<LogDataMng> mergeChildren(List<LogDataMng> savedChildren, List<LogDataMng> bufferedChildren) {
        Map<String, LogDataMng> merged = new LinkedHashMap<>();

        for (LogDataMng child : savedChildren) {
            merged.put(buildKey(child), child);
        }

        for (LogDataMng child : bufferedChildren) {
            merged.put(buildKey(child), child);
        }

        return new ArrayList<>(merged.values());
    }

    // ------------------------------------------------------------------------------------
    // Core logic reused by save() and bufferAndFlush()
    // ------------------------------------------------------------------------------------

    private LogDataMng prepareForPersist(LogDataMng block) {
        return switch (block.getStatus()) {
            case PENDING -> prepareNewBlock(block);
            case COMPLETE, FAIL -> prepareExistingBlock(block);
            default -> throw new IllegalStateException("Unexpected status: " + block.getStatus());
        };
    }

    private LogDataMng prepareNewBlock(LogDataMng block) {
        if (block.getCreatedAt() == null) {
            block.setCreatedAt(Instant.now());
        }
        return block;
    }

    private LogDataMng prepareExistingBlock(LogDataMng incoming) {
        Optional<LogDataMng> existingOpt = findExistingBlock(incoming);
        if (existingOpt.isEmpty()) {
            if (incoming.getCreatedAt() == null) {
                incoming.setCreatedAt(Instant.now());
            }
            return incoming;
        }

        LogDataMng existing = existingOpt.get();

        // merge fields you actually want to update
        existing.setEndOffset(incoming.getEndOffset());
        existing.setStatus(incoming.getStatus());
        existing.setProperties(incoming.getProperties());
        existing.setCreatedAt(Instant.now());

        return existing;
    }

    // ---------------- Lookup logic ----------------

    /**
     * First check in-memory buffer, then DB.
     */
    private Optional<LogDataMng> findExistingBlock(LogDataMng block) {
        Optional<LogDataMng> inBuffer = buffer.findByKey(block);
        if (inBuffer.isPresent()) {
            return inBuffer;
        }

        if (block.getType() == OPERATION) {
            return Optional.empty();
        }

        if (hasLoopIndex(block) ) {
            return metaDataLogRepository.findByExecutionConnectionFlowIdIndexPathAndLoopIndex(
                    block.getConnectionId(),
                    block.getExecutionId(),
                    block.getFlowId(),
                    block.getIndexPath(),
                    getLoopIndex(block)
            );
        }

        return metaDataLogRepository.findByConnectionIdAndExecutionIdAndFlowIdAndIndexPath(
                block.getConnectionId(),
                block.getExecutionId(),
                block.getFlowId(),
                block.getIndexPath()
        );
    }

    private boolean hasLoopIndex(LogDataMng block) {
        return block.getProperties() != null &&
                block.getProperties().containsKey(LogLineKey.LOOP_INDEX.getSrcName());
    }

    private String getLoopIndex(LogDataMng block) {
        return block.getProperties()
                .get(LogLineKey.LOOP_INDEX.getSrcName())
                .toString();
    }

    /**
     * Composite key identical to your DB uniqueness criteria.
     */
    private String buildKey(LogDataMng block) {
        StringBuilder sb = new StringBuilder()
                .append(block.getConnectionId()).append('|')
                .append(block.getExecutionId()).append('|')
                .append(block.getFlowId()).append('|')
                .append(block.getIndexPath());

        if (hasLoopIndex(block)) {
            sb.append('|').append(getLoopIndex(block));
        }
        return sb.toString();
    }

    private boolean isExecutionComplete(LogDataMng block) {
        // adjust enum names to your real ones
        return block.getType() == PhaseCategory.EXECUTION
                && block.getStatus() == PhaseStatus.COMPLETE;
    }
}
