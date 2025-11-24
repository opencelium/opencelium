package com.becon.opencelium.backend.execution.executor;

import com.becon.opencelium.backend.enums.RelationalOperator;
import com.becon.opencelium.backend.execution.ExecutionMemory;
import com.becon.opencelium.backend.execution.executor.extractor.Extractor;
import com.becon.opencelium.backend.execution.executor.extractor.ReferenceExtractor;
import com.becon.opencelium.backend.execution.executor.model.Enhancement;
import com.becon.opencelium.backend.execution.executor.model.FieldBind;
import com.becon.opencelium.backend.execution.executor.model.Loop;
import com.becon.opencelium.backend.execution.executor.model.Operation;
import com.becon.opencelium.backend.invoker.entity.Pagination;
import com.becon.opencelium.backend.enums.PageParam;
import com.becon.opencelium.backend.resource.execution.FlowchartEx;
import com.becon.opencelium.backend.scriptengine.LanguageType;
import com.becon.opencelium.backend.scriptengine.ScriptEngine;
import com.becon.opencelium.backend.scriptengine.ScriptExecutionManager;
import com.becon.opencelium.backend.scriptengine.ScriptExecutionManagerProvider;
import com.becon.opencelium.backend.utility.ReferenceUtility;

import java.util.List;
import java.util.Map;
import java.util.Objects;
import java.util.Optional;
import java.util.stream.Collectors;

public class ExecutionManagerImpl implements ExecutionManager {
    private final Extractor refExtractor;
    private final ScriptExecutionManager scriptExecutionManager;
    private final ExecutionMemory executionMemory;

    public ExecutionManagerImpl(Map<String, Object> webhookVars, List<FlowchartEx> flowcharts, List<FieldBind> fieldBind) {
        this.executionMemory = new ExecutionMemory(webhookVars, fieldBind, flowcharts);
        this.refExtractor = new ReferenceExtractor(this);
        this.scriptExecutionManager = ScriptExecutionManagerProvider.get();
    }

    @Override
    public Map<String, Object> getWebhookVars() {
        return executionMemory.getWebhookVars();
    }

    @Override
    public Map<String, String> getRequestData(Integer ctorId) {
        return executionMemory.getRequestData(ctorId);
    }

    @Override
    public String getPaginationParamValue(PageParam pageParam) {
        return executionMemory.getPaginationParamValue(pageParam);
    }

    @Override
    public Object executeScript(String bindId) {
        Enhancement enhancement = executionMemory.getEnhancementByBindId(bindId);

        ScriptEngine scriptEngine = scriptExecutionManager.resolveEngine(LanguageType.getByCode(enhancement.getLang()))
                .orElseThrow(() -> new RuntimeException("No engine is available for '%s' language".formatted(enhancement.getLang())));

        if (!scriptEngine.isUp()) {
            throw new RuntimeException("Currently, an engine is not up for '%s' language".formatted(enhancement.getLang()));
        }

        scriptEngine.validate(enhancement.getScript());

        return scriptEngine.execute(enhancement.getScript(), enhancement.getArgs(), this::getValue);
    }

    @Override
    public Object getValue(String value) {
        // To trigger this method there should be at least one of 6 reference types in value:
        // ['directRef', 'wrappedDirectRef', 'enhancement', 'webhook', 'pageRef', 'requestData'
        if (value == null) {
            return null;
        }

        // This method extracts 5 reference types:
        // ['wrappedDirectRef', 'enhancement', 'webhook', 'pageRef', 'requestData'
        List<String> references = ReferenceUtility.extractRefs(value);

        // There are 3 cases to skip following if:
        // 1) value == 'directRef': references.isEmpty() == true - we directly call refExtractor.extractValue(value)
        // 2) value is a complex reference (only 5 reference types): references.size() > 1
        // 3) value is a complex reference (only 5 reference types): references.size() == 1 but value is not a reference, it contains a reference
        if (!references.isEmpty() && (references.size() != 1 || !Objects.equals(value, references.get(0)))) {
            for (String ref : references) {
                Object val = refExtractor.extractValue(ref);
                val = val == null ? "" : val.toString();
                value = value.replace(ref, (String) val);
            }

            return value;
        }

        // at this point we could have simple 'directRef' or other 5 reference types
        return refExtractor.extractValue(value);
    }

    @Override
    public void setCurrentCtorId(Integer ctorId) {
        executionMemory.setCurrentCtorId(ctorId);
    }

    @Override
    public void setPagination(Pagination pagination) {
        executionMemory.setPagination(pagination);
    }

    @Override
    public List<Loop> getLoops() {
        return executionMemory.getLoops();
    }


    @Override
    public String generateKey(int loopDepth) {
        List<Loop> loops = executionMemory.getLoops();

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
    public Optional<Operation> findOperationByColor(String color) {
        return executionMemory.findOperationByColor(color);
    }

    @Override
    public void addOperation(Operation operation) {
        executionMemory.getAllOperations().add(operation);
    }

    @Override
    public List<Operation> getAllOperations() {
        return executionMemory.getAllOperations();
    }
}
