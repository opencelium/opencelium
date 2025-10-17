package com.becon.opencelium.backend.execution.logger.tracker;

import com.becon.opencelium.backend.database.mongodb.entity.LogDataMng;
import com.becon.opencelium.backend.execution.logger.builder.PhaseBuilderFactory;
import com.becon.opencelium.backend.execution.logger.builder.PhaseBuilder;
import com.becon.opencelium.backend.execution.logger.context.PhaseContext;
import com.becon.opencelium.backend.execution.logger.context.PhaseContextManager;
import com.becon.opencelium.backend.execution.logger.context.SegmentContext;
import com.becon.opencelium.backend.execution.logger.dto.ErrorDetail;
import com.becon.opencelium.backend.execution.logger.enums.*;
import com.becon.opencelium.backend.execution.logger.keys.LogLineKey;
import com.becon.opencelium.backend.execution.logger.mapper.ParsedLogLineMapper;
import com.becon.opencelium.backend.execution.logger.parser.entity.ParsedLogLine;
import com.becon.opencelium.backend.execution.logger.schema.PhaseSchema;
import com.becon.opencelium.backend.execution.logger.schema.PhaseSchemaRegistry;
import com.becon.opencelium.backend.utility.ApplicationContextUtility;

import java.util.*;

import static com.becon.opencelium.backend.execution.logger.enums.PhaseType.*;

/**
 * Refactored ExecutionTrackerImpl
 * - Removes duplication between phase start/end handling
 * - Adds null-safety and guards around current phase/IDs
 * - Uses dependency injection-friendly constructor chaining
 * - Hardens shouldEmit and segment gating
 * - Avoids NPE/NumberFormatException on connectionId
 */
public class ExecutionTrackerImpl implements ExecutionTracker {
    private static final EnumSet<PhaseType> START_PHASES = EnumSet.of(
            EXECUTION_START, FLOWCHART_START, OPERATION_START, LOOP_START, IF_START
    );
    private static final EnumSet<PhaseType> END_PHASES = EnumSet.of(
            EXECUTION_END, FLOWCHART_END, OPERATION_END, LOOP_END, IF_END
    );

    private String execId;
    private String connId;
    private String flowId;
    private String connectorName;

    private final LogDetailLevel level;
    private final PhaseContextManager phaseContextManager;
    private final PhaseSchemaRegistry phaseSchemaRegistry;
    private final PhaseBuilderFactory builderFactory;
    private final ParsedLogLineMapper parsedLogLineMapper;

    // ---- Constructors -----------------------------------------------------

    public ExecutionTrackerImpl(String execId, String connId, String flowId, LogDetailLevel level) {
        this(execId, connId, flowId, level,
                new PhaseContextManager(),
                new PhaseSchemaRegistry(),
                ApplicationContextUtility.getBean(PhaseBuilderFactory.class),
                ApplicationContextUtility.getBean(ParsedLogLineMapper.class));
    }

    public ExecutionTrackerImpl(LogDetailLevel level) {
        this(null, null, null, level);
    }

    private ExecutionTrackerImpl(
            String execId,
            String connId,
            String flowId,
            LogDetailLevel level,
            PhaseContextManager phaseContextManager,
            PhaseSchemaRegistry phaseSchemaRegistry,
            PhaseBuilderFactory builderFactory,
            ParsedLogLineMapper parsedLogLineMapper
    ) {
        this.execId = execId;
        this.connId = connId;
        this.flowId = flowId;
        this.level = Objects.requireNonNull(level, "LogDetailLevel must not be null");
        this.phaseContextManager = Objects.requireNonNull(phaseContextManager);
        this.phaseSchemaRegistry = Objects.requireNonNull(phaseSchemaRegistry);
        this.builderFactory = Objects.requireNonNull(builderFactory);
        this.parsedLogLineMapper = Objects.requireNonNull(parsedLogLineMapper);
    }

    // ---- Public API -------------------------------------------------------

    @Override
    public Optional<LogDataMng> buildLogData(ParsedLogLine parsedLine) {
        if (parsedLine == null || parsedLine.getStage() == null) {
            return Optional.empty();
        }

        final LogLineType type = parsedLine.getType();
        return switch (type) {
            case PHASE -> handlePhase(parsedLine);
            case SEGMENT -> handleSegment(parsedLine);
            default -> Optional.empty();
        };
    }

    // ---- Internals: Phase handling ---------------------------------------

    private Optional<LogDataMng> handlePhase(ParsedLogLine line) {
        final PhaseType phaseType = (PhaseType) line.getStage();
        final PhaseCategory category = PhaseCategory.fromValue(phaseType);

        final List<String> allowedKeys = phaseSchemaRegistry.getPhasePropertyList(level, category);
        final PhaseContext phaseContext = parsedLogLineMapper.toPhaseContext(line, allowedKeys);

        if (START_PHASES.contains(phaseType)) {
            return onPhaseStart(phaseType, category, phaseContext, line);
        }
        if (END_PHASES.contains(phaseType)) {
            return onPhaseEnd(category, phaseContext);
        }
        return Optional.empty();
    }

    private Optional<LogDataMng> onPhaseStart(PhaseType phaseType,
                                              PhaseCategory category,
                                              PhaseContext phaseContext,
                                              ParsedLogLine parsedLine) {
        phaseContext.setStatus(PhaseStatus.PENDING);

        // Capture identifiers early for downstream builders/emitters
        if (phaseType == EXECUTION_START) {
            this.connId = phaseContext.getProperties().get(LogLineKey.CONNECTION_ID);
            this.execId = phaseContext.getProperties().get(LogLineKey.EXECUTION_ID);
            phaseContextManager.setExecId(execId);
            phaseContextManager.setConnectionId(connId);
        } else if (phaseType == FLOWCHART_START) {
            this.flowId = phaseContext.getProperties().get(LogLineKey.FLOWCHART_ID);
            this.connectorName = phaseContext.getProperties().get(LogLineKey.CONNECTOR_NAME);
            phaseContextManager.setFlowId(flowId);
            phaseContextManager.setConnectorName(connectorName);
        }

        phaseContextManager.startPhase(phaseContext);

        final PhaseSchema phaseSchema = getPhaseSchema(category);
        if (!shouldEmit(phaseSchema, parsedLine)) {
            return Optional.empty();
        }

        LogDataMng out = buildLogDataForContext(category, phaseContext);
        return Optional.ofNullable(out);
    }

    private Optional<LogDataMng> onPhaseEnd(PhaseCategory category,
                                            PhaseContext phaseContext) {
        final PhaseContext closed = phaseContextManager.endPhase(phaseContext);

        // Previous behavior kept COMPLETE status handling commented out; preserving semantics.
        LogDataMng out = buildLogDataForContext(category, closed);

        // Ensure IDs are set on the payload (defensive in case builders omit them)
        if (out != null) {
            out.setExecutionId(execId);
            final Long cid = parseLongOrNull(connId);
            if (cid != null) {
                out.setConnectionId(cid);
            }
        }
        return Optional.ofNullable(out);
    }

    // ---- Internals: Segment handling -------------------------------------

    private Optional<LogDataMng> handleSegment(ParsedLogLine parsedLine) {
        final PhaseContext currentPhaseCtx = phaseContextManager.getCurrentPhase();
        if (currentPhaseCtx == null || currentPhaseCtx.getParsedLogLine() == null) {
            // No active phase to attach this segment to
            return Optional.empty();
        }

        final PhaseType phaseType = (PhaseType) currentPhaseCtx.getParsedLogLine().getStage();
        final PhaseCategory category = PhaseCategory.fromValue(phaseType);

        // Segment gating based on schema
        final SegmentType segmentType = (SegmentType) parsedLine.getStage();
        final Set<String> allowedSegments = Optional
                .ofNullable(phaseSchemaRegistry.getAllowedSegments(level, category))
                .orElse(Collections.emptySet());
        if (!allowedSegments.contains(segmentType.name())) {
            return Optional.empty();
        }

        final List<String> keysToExtract = phaseSchemaRegistry.getSegmentPropertyList(level, category, segmentType);
        final SegmentContext segmentContext = parsedLogLineMapper.toSegmentContext(parsedLine, keysToExtract);

        currentPhaseCtx.addSegment(segmentContext);

        // Shortcut: always emit on EXCEPTION regardless of schema emitOn
        final PhaseSchema phaseSchema = getPhaseSchema(category);
        if (shouldEmit(phaseSchema, parsedLine)) {
            if (segmentType == SegmentType.EXCEPTION) {
                String indexPath = currentPhaseCtx.getParsedLogLine().getProperties().get(LogLineKey.INDEX_PATH);
                currentPhaseCtx.setErrorDetail(new ErrorDetail(indexPath, segmentContext));
                phaseContextManager.addExceptionSegment(indexPath, segmentContext);
            }
            LogDataMng out = buildLogDataForContext(category, currentPhaseCtx);
            return Optional.ofNullable(out);
        }

        return Optional.empty();
    }

    // ---- Utilities --------------------------------------------------------

    private PhaseSchema getPhaseSchema(PhaseCategory category) {
        Map<PhaseCategory, PhaseSchema> schemaMap = phaseSchemaRegistry.getSchema(level);
        return schemaMap != null ? schemaMap.get(category) : null;
    }

    private LogDataMng buildLogDataForContext(PhaseCategory category, PhaseContext ctx) {
        final PhaseBuilder builder = builderFactory.getBuilder(category);
        final Long cid = parseLongOrNull(connId);
        return builder.build(ctx, execId, flowId, cid);
    }

    private boolean shouldEmit(PhaseSchema phaseSchema, ParsedLogLine parsedLine) {
        final String actual = parsedLine.getStage().name();
        if (Objects.equals(actual, SegmentType.EXCEPTION.name())) {
            return true;
        }
        if (phaseSchema == null) {
            return false;
        }
        final List<String> emitOn = phaseSchema.getEmitOn();
        return emitOn != null && emitOn.contains(actual);
    }

    private static Long parseLongOrNull(String value) {
        if (value == null) return null;
        try {
            return Long.valueOf(value);
        } catch (NumberFormatException ignore) {
            return null;
        }
    }
}
