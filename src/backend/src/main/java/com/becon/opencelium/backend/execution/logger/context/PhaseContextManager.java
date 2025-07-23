package com.becon.opencelium.backend.execution.logger.context;


import com.becon.opencelium.backend.execution.logger.enums.PhaseType;
import com.becon.opencelium.backend.execution.logger.keys.LogLineKey;

import java.util.*;

public class PhaseContextManager {

    private String flowId;
    private String connectorName;
    private final Deque<PhaseContext> stack = new ArrayDeque<>();

    public PhaseContextManager() {
    }

    public void startPhase(PhaseContext phaseContext) {
        phaseContext.getParsedLogLine().getProperties().put(LogLineKey.FLOWCHART_ID, flowId);
        phaseContext.getParsedLogLine().getProperties().put(LogLineKey.CONNECTOR_NAME, connectorName);
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
            }
            if (startIndex.equals(endIndex)) {
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
        return stack.poll();
    }

    public PhaseContext getCurrentPhase() {
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
}
