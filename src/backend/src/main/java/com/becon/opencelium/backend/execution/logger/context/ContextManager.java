package com.becon.opencelium.backend.execution.logger.context;

import com.becon.opencelium.backend.execution.logger.parser.entity.ParsedLogLine;

import java.util.*;

public class ContextManager {
//    private final String execId;
//    private final String connId;
//    private String flowId;
//    private final Deque<Context> stack = new ArrayDeque<>();
//
//    public ContextManager(String execId, String connId, String flowId) {
//        this.execId = execId;
//        this.connId = connId;
//        this.flowId = flowId;
//    }
//
//    public void enterOperation(ParsedLogLine parsedLogLine) {
//        OperationContext opCtx = new OperationContext();
//        opCtx.setStartOffset(parsedLogLine.getOffset());
//        opCtx.getStartProps().putAll(parsedLogLine.getProperties());
//        addToStack(opCtx);
//    }
//
//    public void enterLoop(Map<String, String> props) {
//        LoopContext loopCtx = new LoopContext();
//        loopCtx.getStartProps().putAll(props);
//        addToStack(loopCtx);
//    }
//
//    public void enterIf(Map<String, String> props) {
//        IfContext ifCtx = new IfContext();
//        ifCtx.getStartProps().putAll(props);
//        addToStack(ifCtx);
//    }
//
//    public OperationContext currentOperation() {
//        return (OperationContext) stack.peek();
//    }
//
//    public Context peek() {
//        return stack.peek();
//    }
//
//    public OperationContext exitOperation(long endOffset) {
//        Context top = stack.pop();
//        if (!(top instanceof OperationContext opCtx)) {
//            throw new IllegalStateException("Mismatched context on stack: expected OperationContext but found " + top.getClass());
//        }
//        opCtx.setEndOffset(endOffset);
//        return opCtx;
//    }
//
//    public LoopContext exitLoop() {
//        Context top = stack.pop();
//        if (!(top instanceof LoopContext loopCtx)) {
//            throw new IllegalStateException("Mismatched context on stack: expected LoopContext but found " + top.getClass());
//        }
//        return loopCtx;
//    }
//
//    public IfContext exitIf() {
//        Context top = stack.pop();
//        if (!(top instanceof IfContext ifCtx)) {
//            throw new IllegalStateException("Mismatched context on stack: expected IfContext but found " + top.getClass());
//        }
//        return ifCtx;
//    }
//
//    private void addToStack(Context ctx) {
//        if (!stack.isEmpty()) {
//            stack.peek().addChild(ctx); // nest
//        }
//        stack.push(ctx);
//    }
//
//    public void setFlowId(String flowId) {
//        this.flowId = flowId;
//    }
//
//    /**
//     * Called when an EXCEPTION segment occurs.
//     * Clears all nested phases except FLOWCHART and EXECUTION, which are managed by the dispatcher.
//     * Returns all forcibly closed contexts (operations, loops, ifs).
//     */
//    public List<Context> handleException() {
//        List<Context> closed = new ArrayList<>();
//        while (!stack.isEmpty()) {
//            Context ctx = stack.pop();
//            closed.add(ctx);
//        }
//        return closed;
//    }
//
//    public boolean isEmpty() {
//        return stack.isEmpty();
//    }
//
//    public void reset() {
//        stack.clear();
//    }
}
