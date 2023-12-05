package com.becon.opencelium.backend.execution;

import com.becon.opencelium.backend.execution.oc721.Connector;
import com.becon.opencelium.backend.execution.oc721.Operation;

import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;
import java.util.Optional;

public class ExecutionManagerImpl implements ExecutionManager {
    private final Map<String, Object> queryParams;
    private final LinkedHashMap<String, String> loops = new LinkedHashMap<>();
    private Connector connectorFrom;
    private Connector connectorTo;
    private List<Operation> operations;

    public ExecutionManagerImpl(Map<String, Object> queryParams) {
        this.queryParams = queryParams;
    }

    @Override
    public Map<String, Object> getQueryParams() {
        return queryParams;
    }

    @Override
    public LinkedHashMap<String, String> getLoops() {
        return loops;
    }

    @Override
    public Map<String, String> getRequiredData(String ctorId) {
        return null;
    }

    @Override
    public Optional<Operation> findOperationByColor(String color) {
        return operations.stream().filter(operation -> operation.getColor().equals(color)).findFirst();
    }
}
