package com.becon.opencelium.backend.execution;

import com.becon.opencelium.backend.execution.oc721.Connector;
import com.becon.opencelium.backend.execution.oc721.Enhancement;
import com.becon.opencelium.backend.execution.oc721.EnhancementService;
import com.becon.opencelium.backend.execution.oc721.EnhancementServiceImpl;
import com.becon.opencelium.backend.execution.oc721.Extractor;
import com.becon.opencelium.backend.execution.oc721.FieldBind;
import com.becon.opencelium.backend.execution.oc721.Operation;
import com.becon.opencelium.backend.execution.oc721.ReferenceExtractor;

import java.util.ArrayList;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;
import java.util.Objects;
import java.util.Optional;

public class ExecutionManagerImpl implements ExecutionManager {
    private final Map<String, Object> queryParams;
    private final Extractor refExtractor;
    private final EnhancementService enhancementService;
    private final LinkedHashMap<String, String> loops = new LinkedHashMap<>();
    private final Connector connectorFrom;
    private final Connector connectorTo;
    private final List<FieldBind> fieldBind;
    private final List<Operation> operations = new ArrayList<>();
    private Integer currentCtorId;

    public ExecutionManagerImpl(Map<String, Object> queryParams, Connector connectorFrom, Connector connectorTo, List<FieldBind> fieldBind) {
        this.queryParams = queryParams;
        this.connectorFrom = connectorFrom;
        this.connectorTo = connectorTo;
        this.fieldBind = fieldBind;

        this.refExtractor = new ReferenceExtractor(this);
        this.enhancementService = new EnhancementServiceImpl(this);
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
    public String generateKey() {
        if (loops.isEmpty()) {
            return "#";
        }

        return String.join(", ", loops.values());
    }

    @Override
    public Map<String, String> getRequestData(Integer ctorId) {
        // if 'connectorId' is null then use current connectors' id:
        ctorId = ctorId == null ? this.currentCtorId : ctorId;

        if (Objects.equals(ctorId, connectorFrom.getId())) {
            return connectorFrom.getRequiredData();
        }

        if (Objects.equals(ctorId, connectorTo.getId())) {
            return connectorTo.getRequiredData();
        }

        throw new RuntimeException("Non existing connector id 'ctorId' = " + ctorId);
    }

    @Override
    public Optional<Operation> findOperationByColor(String color) {
        return operations.stream()
                .filter(operation -> operation.getColor().equals(color))
                .findFirst();
    }

    @Override
    public Object executeScript(String bindId) {
        Enhancement enhancement = fieldBind.stream()
                .filter(fb -> Objects.equals(bindId, fb.getBindId()))
                .map(FieldBind::getEnhance).findFirst()
                .orElseThrow(() -> new RuntimeException("Non existing fieldBind id 'bindId' = " + bindId));

        return enhancementService.execute(enhancement);
    }

    @Override
    public Object getValue(String ref) {
        return refExtractor.extractValue(ref);
    }

    @Override
    public void addOperation(Operation operation) {
        this.operations.add(operation);
    }

    @Override
    public void setCurrentCtorId(Integer ctorId) {
        this.currentCtorId = ctorId;
    }
}
