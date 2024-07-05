package com.becon.opencelium.backend.execution;

import com.becon.opencelium.backend.enums.RelationalOperator;
import com.becon.opencelium.backend.execution.oc721.Connector;
import com.becon.opencelium.backend.execution.oc721.Enhancement;
import com.becon.opencelium.backend.execution.oc721.EnhancementService;
import com.becon.opencelium.backend.execution.oc721.EnhancementServiceImpl;
import com.becon.opencelium.backend.execution.oc721.Extractor;
import com.becon.opencelium.backend.execution.oc721.FieldBind;
import com.becon.opencelium.backend.execution.oc721.Loop;
import com.becon.opencelium.backend.execution.oc721.Operation;
import com.becon.opencelium.backend.execution.oc721.ReferenceExtractor;
import com.becon.opencelium.backend.invoker.entity.Pagination;
import com.becon.opencelium.backend.invoker.enums.PageParam;

import java.util.ArrayList;
import java.util.List;
import java.util.Map;
import java.util.Objects;
import java.util.Optional;
import java.util.stream.Collectors;

import static com.becon.opencelium.backend.constant.RegExpression.pageRef;

public class ExecutionManagerImpl implements ExecutionManager {
    private final Map<String, Object> webhookVars;
    private final Extractor refExtractor;
    private final EnhancementService enhancementService;
    private final List<Loop> loops = new ArrayList<>();
    private final Connector connectorFrom;
    private final Connector connectorTo;
    private final List<FieldBind> fieldBind;
    private final List<Operation> operations = new ArrayList<>();
    private Integer currentCtorId;
    private Pagination pagination;

    public ExecutionManagerImpl(Map<String, Object> webhookVars, Connector connectorFrom, Connector connectorTo, List<FieldBind> fieldBind) {
        this.webhookVars = webhookVars;
        this.connectorFrom = connectorFrom;
        this.connectorTo = connectorTo;
        this.fieldBind = fieldBind;

        this.refExtractor = new ReferenceExtractor(this);
        this.enhancementService = new EnhancementServiceImpl(this);
    }

    @Override
    public Map<String, Object> getWebhookVars() {
        return webhookVars;
    }

    @Override
    public List<Loop> getLoops() {
        return loops;
    }

    @Override
    public String generateKey(int loopDepth) {
        if (loopDepth == 0 || loops.isEmpty()) {
            return "#";
        }

        return loops.stream()
                .limit(loopDepth)
                .map(loop -> {
                    if (loop.getOperator() == RelationalOperator.FOR) {
                        return String.valueOf(loop.getIndex());
                    } else {
                        return loop.getValue();
                    }
                })
                .collect(Collectors.joining(", "));
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
        if (ref == null) {
            return null;
        } else if (ref.matches(pageRef)) {
            String param = ref.replace("@{", "").replace("}","");
            return pagination.getParamValue(PageParam.fromString(param));
        }
        return refExtractor.extractValue(ref);
    }

    @Override
    public void addOperation(Operation operation) {
        this.operations.add(operation);
    }

    @Override
    public List<Operation> getAllOperations() {
        return operations;
    }

    @Override
    public void setCurrentCtorId(Integer ctorId) {
        this.currentCtorId = ctorId;
    }

    @Override
    public void setPagination(Pagination pagination) {
        this.pagination = pagination;
    }
}
