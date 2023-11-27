package com.becon.opencelium.backend.execution;

import com.becon.opencelium.backend.execution.action.Loop;
import com.becon.opencelium.backend.execution.oc721.Operation;
import com.becon.opencelium.backend.execution.oc721.*;

import java.util.LinkedList;
import java.util.List;
import java.util.Map;

public class ExecutionManagerImpl implements ExecutionManager {
    private Map<String, Object> queryParams;
    private LinkedList<Loop> loops;
    private Connector connectorFrom;
    private Connector connectorTo;
    private List<Operation> operations;
    private Extractor refExtractor;
    private EnhancementService enhancementService;

    @Override
    public String getQueryParam(String param) {
        return null;
    }

    @Override
    public void addLoop(Loop action) {
    }

    @Override
    public Map<String, String> getRequiredData(String ctorId) {
        return null;
    }

    @Override
    public Operation findOperationByColor(String color) {
        return null;
    }
}
