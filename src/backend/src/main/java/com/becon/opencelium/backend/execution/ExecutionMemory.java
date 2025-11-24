package com.becon.opencelium.backend.execution;

import com.becon.opencelium.backend.enums.PageParam;
import com.becon.opencelium.backend.execution.executor.model.Enhancement;
import com.becon.opencelium.backend.execution.executor.model.FieldBind;
import com.becon.opencelium.backend.execution.executor.model.Loop;
import com.becon.opencelium.backend.execution.executor.model.Operation;
import com.becon.opencelium.backend.invoker.entity.Pagination;
import com.becon.opencelium.backend.resource.execution.FlowchartEx;

import java.util.ArrayList;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.Objects;
import java.util.Optional;

public class ExecutionMemory {
    // initialized once
    private final List<FieldBind> fieldBind;
    private final Map<String, Object> webhookVars;
    private final Map<Integer, Map<String, String>> requestDataMap = new HashMap<>();

    // updated during execution
    private Integer connectorId;
    private Pagination pagination;
    private final List<Loop> loops = new ArrayList<>();
    private final List<Operation> operations = new ArrayList<>();

    public ExecutionMemory(Map<String, Object> webhookVars, List<FieldBind> fieldBind, List<FlowchartEx> flowcharts) {
        this.webhookVars = webhookVars;
        this.fieldBind = fieldBind;
        flowcharts.forEach(flowchart -> requestDataMap.put(flowchart.getCtorId(), flowchart.getRequiredData()));
    }

    public Map<String, Object> getWebhookVars() {
        return webhookVars;
    }

    public List<Loop> getLoops() {
        return loops;
    }

    public Map<String, String> getRequestData(Integer ctorId) {
        // if 'connectorId' is null then use current connectors' id:
        ctorId = ctorId == null ? this.connectorId : ctorId;

        return requestDataMap.get(ctorId);
    }

    public String getPaginationParamValue(PageParam pageParam) {
        return pagination.getParamValue(pageParam);
    }

    public Enhancement getEnhancementByBindId(String bindId) {
        return fieldBind.stream()
                .filter(fb -> Objects.equals(bindId, fb.getBindId()))
                .map(FieldBind::getEnhance).findFirst()
                .orElseThrow(() -> new RuntimeException("Non existing fieldBind id 'bindId' = " + bindId));
    }

    public Optional<Operation> findOperationByColor(String color) {
        return operations.stream()
                .filter(operation -> operation.getColor().equals(color))
                .findFirst();
    }

    public void setCurrentCtorId(Integer ctorId) {
        this.connectorId = ctorId;
    }

    public void setPagination(Pagination pagination) {
        this.pagination = pagination;
    }

    public List<Operation> getAllOperations() {
        return operations;
    }
}
