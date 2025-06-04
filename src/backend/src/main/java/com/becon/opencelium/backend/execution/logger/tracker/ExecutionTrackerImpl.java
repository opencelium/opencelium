package com.becon.opencelium.backend.execution.logger.tracker;

import com.becon.opencelium.backend.database.mongodb.entity.LogMetaData;
import com.becon.opencelium.backend.execution.logger.context.Context;
import com.becon.opencelium.backend.execution.logger.context.ContextManager;
import com.becon.opencelium.backend.execution.logger.context.OperationContext;
import com.becon.opencelium.backend.execution.logger.enums.LogLineStage;
import com.becon.opencelium.backend.execution.logger.enums.LogProcessingMode;
import com.becon.opencelium.backend.execution.logger.parser.entity.ParsedLogLine;
import com.becon.opencelium.backend.execution.logger.service.LogMetaDataService;
import com.becon.opencelium.backend.execution.logger.service.LogMetaDataServiceImp;
import com.becon.opencelium.backend.utility.ApplicationContextUtility;

import java.util.EnumMap;
import java.util.Map;
import java.util.Optional;

public class ExecutionTrackerImpl implements ExecutionTracker{
    private final String execId;
    private final String connId;
    private String flowId;
    private final LogProcessingMode mode;

    private final ContextManager contextManager;
    // Map PHASE → its corresponding MetadataBuilder strategy.
    private final Map<LogLineStage, MetadataBuilder<? extends Context>> builderMap;

    public ExecutionTrackerImpl(String execId, String connId,String flowId, LogProcessingMode mode) {
        this.execId = execId;
        this.connId = connId;
        this.flowId = flowId;
        this.mode = mode;
        this.contextManager = new ContextManager(execId, connId, flowId);

        // Initialize the map of strategies:
        this.builderMap = new EnumMap<>(LogLineStage.class);
        builderMap.put(LogLineStage.OPERATION_END, new OperationMetadataBuilder(execId, connId));
        builderMap.put(LogLineStage.LOOP_END,      new LoopMetadataBuilder(execId, connId));
        builderMap.put(LogLineStage.IF_END,        new IfMetadataBuilder(execId, connId));
    }

    @Override
    public Optional<LogMetaData> handleParsedLine(ParsedLogLine parsedLine) {
        switch (parsedLine.getLogLineType()) {
            case PHASE:
                return handlePhase(parsedLine);
            case SEGMENT:
                return handleSegment(parsedLine);
            default:
                return Optional.empty();
        }
    }

    private Optional<LogMetaData> handlePhase(ParsedLogLine line) {
        LogLineStage type = line.getStage();
        Map<String, String> props = line.getProperties();

        switch (type) {
            case FLOWCHART_START -> {
                this.flowId = props.get("id");
                contextManager.setFlowId(flowId);
                return Optional.empty();
            }
            case OPERATION_START -> {
                contextManager.enterOperation(line);
                if (mode == LogProcessingMode.METADATA) {
                    LogMetaData meta = opBuilder.build(contextManager.currentOperation(), flowId, line.getOffset(), -1L);
                    return Optional.of(meta); // store initial metadata
                }
                return Optional.empty();
            }
            case OPERATION_END -> {
                OperationContext ctx = contextManager.exitOperation(line.getOffset());
                LogMetaData meta = opBuilder.build(ctx, flowId, ctx.getStartOffset(), line.getOffset());
                return Optional.of(meta);
            }
            case LOOP_START -> {
                contextManager.enterLoop(props);
                return Optional.empty();
            }
            case LOOP_END -> {
                LoopContext loopCtx = contextManager.exitLoop();
                LogMetaData meta = loopBuilder.build(loopCtx, flowchartId, 0L, 0L);
                return Optional.of(meta);
            }
            case IF_START -> {
                contextManager.enterIf(props);
                return Optional.empty();
            }
            case IF_END -> {
                IfContext ifCtx = contextManager.exitIf();
                LogMetaData meta = ifBuilder.build(ifCtx, flowId, 0L, 0L);
                return Optional.of(meta);
            }
            default -> {
                return Optional.empty(); // ignore other phase types
            }
        }
    }
}
