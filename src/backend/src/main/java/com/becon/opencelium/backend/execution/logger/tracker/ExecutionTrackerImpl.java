package com.becon.opencelium.backend.execution.logger.tracker;

import com.becon.opencelium.backend.database.mongodb.entity.LogData;
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

public class ExecutionTrackerImpl implements ExecutionTracker {
    private String execId;
    private String connId;
    private String flowId;
    private final LogDetailLevel level;

    private final PhaseContextManager phaseContextManager;
    private final PhaseSchemaRegistry phaseSchemaRegistry;
    private final PhaseBuilderFactory builderFactory;
    private final ParsedLogLineMapper parsedLogLineMapper;
    private String connectorName;


    public ExecutionTrackerImpl(String execId, String connId,String flowId, LogDetailLevel level) {
        this.execId = execId;
        this.connId = connId;
        this.flowId = flowId;
        this.level = level;
        this.phaseContextManager = new PhaseContextManager();
        this.phaseSchemaRegistry = new PhaseSchemaRegistry();
        this.parsedLogLineMapper = ApplicationContextUtility.getBean(ParsedLogLineMapper.class);
        this.builderFactory = ApplicationContextUtility.getBean(PhaseBuilderFactory.class);
    }

    public ExecutionTrackerImpl(LogDetailLevel level) {
        this.level = level;
        this.phaseContextManager = new PhaseContextManager();
        this.phaseSchemaRegistry = new PhaseSchemaRegistry();
        this.parsedLogLineMapper = ApplicationContextUtility.getBean(ParsedLogLineMapper.class);
        this.builderFactory = ApplicationContextUtility.getBean(PhaseBuilderFactory.class);
    }

    @Override
    public Optional<LogData> buildLogData(ParsedLogLine parsedLine) {
        List<String> keysToExtract;

        if (parsedLine.getType() == LogLineType.PHASE) {
            PhaseType phaseType = (PhaseType) parsedLine.getStage();
            PhaseCategory category = PhaseCategory.fromValue(phaseType);

            keysToExtract = phaseSchemaRegistry
                    .getPhasePropertyList(level, category);

            return handlePhase(parsedLine, keysToExtract);

        } else if (parsedLine.getType() == LogLineType.SEGMENT) {
            PhaseType currentPhase = (PhaseType) phaseContextManager.getCurrentPhase().getParsedLogLine().getStage();
            PhaseCategory category = PhaseCategory.fromValue(currentPhase);

            SegmentType segmentType = (SegmentType) parsedLine.getStage();
            Set<String> allowedSegments = phaseSchemaRegistry.getAllowedSegments(level, category);
            if (!allowedSegments.contains(parsedLine.getStage().name())) {
                return Optional.empty();
            }
            keysToExtract = phaseSchemaRegistry
                    .getSegmentPropertyList(level, category, segmentType);

            return handleSegment(parsedLine, keysToExtract);
        }

        return Optional.empty();
    }

    private Optional<LogData> handlePhase(ParsedLogLine line, List<String> allowedPhaseKeys) {
        PhaseCategory phaseCategory = PhaseCategory.fromValue((PhaseType) line.getStage());
        PhaseSchema phaseSchema = phaseSchemaRegistry.getSchema(level).get(phaseCategory);
        LogLineStage stage = line.getStage();

        if (stage.getStageType() != LogLineType.PHASE) {
            return Optional.empty();
        }

        PhaseType phaseType = (PhaseType) stage;
        PhaseBuilder phaseBuilder = builderFactory.getBuilder(PhaseCategory.fromValue(phaseType));
        PhaseContext phaseContext = parsedLogLineMapper.toPhaseContext(line, allowedPhaseKeys);

        // Handle start events
        if (isStartPhase(phaseType)) {
            phaseContext.setStatus(PhaseStatus.PENDING);
            if (phaseType == EXECUTION_START) {
                this.connId = phaseContext.getProperties().get(LogLineKey.CONNECTION_ID);
                this.execId = phaseContext.getProperties().get(LogLineKey.EXECUTION_ID);
                phaseContextManager.setExecId(execId);
                phaseContextManager.setConnectionId(connId);
                phaseContextManager.startPhase(phaseContext);
            } else if (phaseType == PhaseType.FLOWCHART_START) {
                this.flowId = phaseContext.getProperties().get(LogLineKey.FLOWCHART_ID);
                this.connectorName = phaseContext.getProperties().get(LogLineKey.CONNECTOR_NAME);
                phaseContextManager.setFlowId(flowId);
                phaseContextManager.setConnectorName(connectorName);
                phaseContextManager.startPhase(phaseContext);
            } else {
                phaseContextManager.startPhase(phaseContext);
            }

            if (shouldEmit(phaseSchema, line)) {
                LogData logData = phaseBuilder.build(phaseContext, execId, Long.valueOf(connId));
                return Optional.of(logData);
            }

            return Optional.empty();
        }

        // Handle end events
        if (isEndPhase(phaseType)) {
            PhaseContext closed = phaseContextManager.endPhase(phaseContext);
//            if (closed.getStatus() == PhaseStatus.COMPLETE) {
//                return Optional.empty();
//            }
//            closed.setStatus(PhaseStatus.COMPLETE);
            LogData meta = phaseBuilder.build(closed, execId, Long.valueOf(connId));
            meta.setExecutionId(execId);
            meta.setConnectionId(Long.valueOf(connId));
            return Optional.of(meta);
        }
        return Optional.empty(); // unsupported phase type
    }


    private Optional<LogData> handleSegment(ParsedLogLine parsedLine, List<String> keysToExtract) {
        PhaseContext currentPhaseCtx = phaseContextManager.getCurrentPhase();

        SegmentContext segmentContext = parsedLogLineMapper.toSegmentContext(parsedLine, keysToExtract);
        currentPhaseCtx.addSegment(segmentContext);

        PhaseType phaseType = (PhaseType) currentPhaseCtx.getParsedLogLine().getStage();
        PhaseCategory phaseCategory = PhaseCategory.fromValue(phaseType);
        PhaseSchema phaseSchema = phaseSchemaRegistry.getSchema(level).get(phaseCategory);

        if (shouldEmit(phaseSchema, parsedLine)) {
//            currentPhaseCtx.setStatus(PhaseStatus.COMPLETE);
            if(Objects.equals(segmentContext.getSegmentType(), SegmentType.EXCEPTION)) {
                String index_path = currentPhaseCtx.getParsedLogLine().getProperties().get(LogLineKey.INDEX_PATH);
                currentPhaseCtx.setErrorDetail(new ErrorDetail(index_path, segmentContext));
                phaseContextManager.addExceptionSegment(index_path, segmentContext);
                phaseContextManager.endCurrentPhase();
            }
            PhaseBuilder builder = builderFactory.getBuilder(phaseCategory);
            LogData logData = builder.build(currentPhaseCtx, execId, Long.parseLong(connId));
            return Optional.of(logData);
        }

        return Optional.empty();
    }

    private boolean shouldEmit(PhaseSchema phaseSchema, ParsedLogLine parsedLine) {
        String actual = parsedLine.getStage().name();
        if (Objects.equals(actual, SegmentType.EXCEPTION.name())) {
            return true;
        }
        if (phaseSchema == null) {
            return false;
        }
        List<String> emitOnList = phaseSchema.getEmitOn();
        return emitOnList.contains(actual);
    }

    private boolean isStartPhase(PhaseType type) {
        return switch (type) {
            case EXECUTION_START, FLOWCHART_START, OPERATION_START, LOOP_START, IF_START -> true;
            default -> false;
        };
    }

    private boolean isEndPhase(PhaseType type) {
        return switch (type) {
            case EXECUTION_END, FLOWCHART_END, OPERATION_END, LOOP_END, IF_END -> true;
            default -> false;
        };
    }
}
