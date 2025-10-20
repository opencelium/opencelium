package com.becon.opencelium.backend.execution.executor;

import com.becon.opencelium.backend.resource.execution.ExecutionPlanEx;

import java.util.HashMap;
import java.util.Map;

public class ExecutorService {
    private Map<String, FlowchartExecutor> executors = new HashMap<>();

    public ExecutorService(ExecutionPlanEx plan) {

    }

    public void submit(String flowId, FlowchartExecutor executor) {
        executors.put(flowId, executor);
    }

    public void execute() {

    }
}
