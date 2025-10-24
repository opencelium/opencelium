package com.becon.opencelium.backend.execution.executor;

import com.becon.opencelium.backend.resource.execution.ExecutionPlanEx;

import java.util.HashMap;
import java.util.Map;

public class ExecutorService {
    private final ExecutionPlanEx plan;
    private final Map<String, FlowchartExecutor> executors = new HashMap<>();

    public ExecutorService(ExecutionPlanEx plan) {
        this.plan = plan;
        // TODO: add execution strategies based on SEQUENTIAL and PARALLEL
    }

    public void submit(String flowId, FlowchartExecutor executor) {
        executors.put(flowId, executor);
    }

    public void execute() {
        for (String flowId: plan.getSteps()) {
            executors.get(flowId).start();
        }
    }
}
