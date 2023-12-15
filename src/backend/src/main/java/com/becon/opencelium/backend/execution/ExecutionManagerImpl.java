package com.becon.opencelium.backend.execution;

import com.becon.opencelium.backend.execution.oc721.Connector;
import com.becon.opencelium.backend.execution.oc721.Enhancement;
import com.becon.opencelium.backend.execution.oc721.EnhancementService;
import com.becon.opencelium.backend.execution.oc721.Extractor;
import com.becon.opencelium.backend.execution.oc721.FieldBind;
import com.becon.opencelium.backend.execution.oc721.Operation;

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

    public ExecutionManagerImpl(Map<String, Object> queryParams, Extractor refExtractor, EnhancementService enhancementService,
                                Connector connectorFrom, Connector connectorTo, List<FieldBind> fieldBind) {
        this.queryParams = queryParams;
        this.refExtractor = refExtractor;
        this.enhancementService = enhancementService;
        this.connectorFrom = connectorFrom;
        this.connectorTo = connectorTo;
        this.fieldBind = fieldBind;
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
        if (Objects.equals(ctorId, String.valueOf(connectorFrom.getId()))) {
            return connectorFrom.getRequiredData();
        }

        if (Objects.equals(ctorId, String.valueOf(connectorTo.getId()))) {
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
        return enhancementService.executeScript(bindId);
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
    public Enhancement getEnhanceByBindId(String bindId) {
        return fieldBind.stream()
                .filter(fb -> Objects.equals(bindId, fb.getBindId()))
                .map(FieldBind::getEnhance).findFirst()
                .orElseThrow(() -> new RuntimeException("Non existing fieldBind id 'bindId' = " + bindId));
    }
}
