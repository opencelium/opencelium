package com.becon.opencelium.backend.execution.logger.context;


import com.becon.opencelium.backend.execution.logger.dto.ErrorDetail;
import com.becon.opencelium.backend.execution.logger.enums.PhaseStatus;
import com.becon.opencelium.backend.execution.logger.enums.PhaseType;
import com.becon.opencelium.backend.execution.logger.enums.SegmentType;
import com.becon.opencelium.backend.execution.logger.keys.LogLineKey;

import java.util.*;

public class PhaseContextManager {

    private String execId;
    private String connectionId;
    private String flowId;
    private String connectorName;
    private final Deque<PhaseContext> stack = new ArrayDeque<>();

    public PhaseContextManager() {
    }

    public void startPhase(PhaseContext phaseContext) {
        Map<LogLineKey, String> props = phaseContext.getParsedLogLine().getProperties();
        props.put(LogLineKey.EXECUTION_ID, execId);
        props.put(LogLineKey.CONNECTION_ID, connectionId);
        if (flowId != null) {
            props.put(LogLineKey.FLOWCHART_ID, flowId);
            props.put(LogLineKey.CONNECTOR_NAME, connectorName);
        }

        stack.push(phaseContext);
    }

    public PhaseContext endPhase(PhaseContext phaseContext) {
        if (stack.isEmpty()) {
            throw new IllegalStateException("No phases to end. Stack is empty.");
        }

        // Remove from top until we find the matching context
        PhaseContext removed = null;

        while (!stack.isEmpty()) {
            PhaseContext current = stack.pop(); // remove from top of stack
            String startIndex = current.getParsedLogLine().getProperties().get(LogLineKey.INDEX_PATH);
            String endIndex = phaseContext.getParsedLogLine().getProperties().get(LogLineKey.INDEX_PATH);
            if (phaseContext.getParsedLogLine().getStage() == PhaseType.FLOWCHART_END) {
                startIndex = current.getParsedLogLine().getProperties().get(LogLineKey.FLOWCHART_ID);
                endIndex = phaseContext.getParsedLogLine().getProperties().get(LogLineKey.FLOWCHART_ID);
                flowId = "";
            } else if (phaseContext.getParsedLogLine().getStage() == PhaseType.EXECUTION_END) {
                startIndex = current.getParsedLogLine().getProperties().get(LogLineKey.EXECUTION_ID);
                endIndex = phaseContext.getParsedLogLine().getProperties().get(LogLineKey.EXECUTION_ID);
                execId = "";
                connectionId = "";
            }
            if (startIndex.equals(endIndex)) {
                current.setEndOffset(phaseContext.getEndOffset());
                current.setStatus(PhaseStatus.COMPLETE);
                removed = current;
                break;
            }
        }

        if (removed == null) {
            throw new IllegalStateException("Phase context to end was not found in stack.");
        }
        return removed;
    }

    public PhaseContext endCurrentPhase() {
//        if (errorDetail != null) {
//            PhaseContext context = stack.pop();
//            context.setErrorDetail(this.errorDetail);
//            return context;
//        }
        return stack.pop();
    }

    public PhaseContext getCurrentPhase() {
//        if (errorDetail != null) {
//            PhaseContext context = stack.peek();
//            if (context != null) {
//                context.setErrorDetail(this.errorDetail);
//            }
//            return context;
//        }
        return stack.peek();
    }

    public void setFlowId(String flowId) {
        this.flowId = flowId;
    }

    public String getConnectorName() {
        return connectorName;
    }

    public void setConnectorName(String connectorName) {
        this.connectorName = connectorName;
    }

    public void setExecId(String execId) {
        this.execId = execId;
    }

    public void setConnectionId(String connectionId) {
        this.connectionId = connectionId;
    }

    /**
     * Called when an EXCEPTION segment occurs.
     * Clears all nested phases except FLOWCHART and EXECUTION, which are managed by the dispatcher.
     * Returns all forcibly closed contexts (operations, loops, ifs).
     */
    public List<PhaseContext> handleException() {
        List<PhaseContext> closed = new ArrayList<>();
        while (!stack.isEmpty()) {
            PhaseContext ctx = stack.pop();
            closed.add(ctx);
        }
        return closed;
    }

    public boolean isEmpty() {
        return stack.isEmpty();
    }

    public void reset() {
        stack.clear();
    }

    public void addExceptionSegment(String errorOfOriginPath,SegmentContext segmentContext) {
        if (segmentContext.getSegmentType() != SegmentType.EXCEPTION) {
            throw new IllegalArgumentException("Requires only EXCEPTION type. Segment type: " + segmentContext.getSegmentType().name() + " is not acceptable.");
        }
        PhaseContext currentPhase = getCurrentPhase();
        ErrorDetail errorDetail = new ErrorDetail(errorOfOriginPath, segmentContext);
        currentPhase.setErrorDetail(errorDetail);
    }
}
