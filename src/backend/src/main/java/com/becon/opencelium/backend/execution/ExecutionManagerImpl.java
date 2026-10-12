package com.becon.opencelium.backend.execution;

import com.becon.opencelium.backend.enums.PageParam;
import com.becon.opencelium.backend.enums.RelationalOperator;
import com.becon.opencelium.backend.exception.ReferenceNotFoundException;
import com.becon.opencelium.backend.execution.logger.OcLogger;
import com.becon.opencelium.backend.execution.logger.ThreadLocalOcLogger;
import com.becon.opencelium.backend.execution.logger.msg.ExecutionLog;
import com.becon.opencelium.backend.execution.oc721.Extractor;
import com.becon.opencelium.backend.execution.oc721.Loop;
import com.becon.opencelium.backend.execution.oc721.Operation;
import com.becon.opencelium.backend.execution.oc721.ReferenceExtractor;
import com.becon.opencelium.backend.invoker.entity.Pagination;
import com.becon.opencelium.backend.reference.ReferenceScanner;
import com.becon.opencelium.backend.resource.execution.EnhancementEx;
import com.becon.opencelium.backend.resource.execution.FieldBindEx;
import com.becon.opencelium.backend.scriptengine.LanguageType;
import com.becon.opencelium.backend.scriptengine.ScriptEngine;
import com.becon.opencelium.backend.scriptengine.ScriptExecutionManager;
import com.becon.opencelium.backend.scriptengine.ScriptExecutionManagerProvider;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.web.client.RestTemplate;

import java.util.ArrayList;
import java.util.List;
import java.util.Map;
import java.util.Objects;
import java.util.Optional;
import java.util.stream.Collectors;

public class ExecutionManagerImpl implements ExecutionManager {
    private static final Logger log = LoggerFactory.getLogger(ExecutionManagerImpl.class);

    // substituted for a reference whose data has never been produced
    private static final String MISSING_REFERENCE_VALUE = "";

    private final Map<String, Object> webhookVars;
    private final Map<Integer, Map<String, String>> requestData;
    private final Map<Integer, RestTemplate> restTemplate;
    private final Map<Integer, Pagination> pagination;
    private final Extractor refExtractor;
    private final List<Loop> loops = new ArrayList<>();
    private final List<FieldBindEx> fieldBind;
    private final List<Operation> operations = new ArrayList<>();
    private final ScriptExecutionManager scriptExecutionManager;
    private final OcLogger<ExecutionLog> logger;
    private Integer currentConnectorId;
    private Pagination currentPagination;

    public ExecutionManagerImpl(
            Map<String, Object> webhookVars,
            List<FieldBindEx> fieldBind,
            Map<Integer, Map<String, String>> requestData,
            Map<Integer, RestTemplate> restTemplate,
            Map<Integer, Pagination> pagination
    ) {
        this.webhookVars = webhookVars;
        this.fieldBind = fieldBind;
        this.requestData = requestData;
        this.restTemplate = restTemplate;
        this.pagination = pagination;

        this.refExtractor = new ReferenceExtractor(this);
        this.scriptExecutionManager = ScriptExecutionManagerProvider.get();
        this.logger = ThreadLocalOcLogger.get();
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
        ctorId = ctorId == null ? this.currentConnectorId : ctorId;

        if (requestData.containsKey(ctorId)) {
            return requestData.get(ctorId);
        }

        throw new RuntimeException("Non existing connector id 'ctorId' = " + ctorId);
    }

    @Override
    public RestTemplate resolveRestTemplate() {
        return restTemplate.get(currentConnectorId);
    }

    @Override
    public Pagination resolvePagination() {
        return pagination.get(currentConnectorId);
    }

    @Override
    public Optional<Operation> findOperationByColor(String color) {
        return operations.stream()
                .filter(operation -> operation.getColor().equals(color))
                .findFirst();
    }

    @Override
    public Object executeScript(String bindId) {
        EnhancementEx enhancement = fieldBind.stream()
                .filter(fb -> Objects.equals(bindId, fb.getBindId()))
                .map(FieldBindEx::getEnhance).findFirst()
                .orElseThrow(() -> new RuntimeException("Non existing fieldBind id 'bindId' = " + bindId));

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
        List<String> references = ReferenceScanner.extract(value);

        // There are 3 cases to skip following if:
        // 1) value == 'directRef': references.isEmpty() == true - we directly call refExtractor.extractValue(value)
        // 2) value is a complex reference (only 5 reference types): references.size() > 1
        // 3) value is a complex reference (only 5 reference types): references.size() == 1 but value is not a reference, it contains a reference
        if (!references.isEmpty() && (references.size() != 1 || !Objects.equals(value, references.get(0)))) {
            for (String ref : references) {
                Object val = extractOrEmpty(ref);
                val = val == null ? "" : val.toString();
                value = value.replace(ref, (String) val);
            }

            return value;
        }

        // at this point we could have simple 'directRef' or other 5 reference types
        return extractOrEmpty(value);
    }

    /**
     * Resolves a single reference, tolerating data that has never been produced.
     *
     * <p>A reference whose method has not been executed - so neither its request nor its
     * response is held by the container - is not an execution failure: the incident is
     * reported to the server console and to the execution log, an empty value takes the place
     * of the missing one, and the execution continues. Every other resolution failure - an
     * error response, an unparsable body, a malformed reference - still stops the execution.
     */
    private Object extractOrEmpty(String reference) {
        try {
            return refExtractor.extractValue(reference);
        } catch (ReferenceNotFoundException e) {
            reportMissingReference(reference, e);

            return MISSING_REFERENCE_VALUE;
        }
    }

    private void reportMissingReference(String reference, ReferenceNotFoundException cause) {
        String message = "%s An empty value is used instead and the execution continues."
                .formatted(cause.getMessage());

        log.warn("Reference '{}' is not resolved. {}", reference, message);
        logger.logAndSend("segment=REF_NOT_FOUND ref=(%s) data=%s".formatted(reference, message));
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
        if (ctorId != null) {
            this.currentConnectorId = ctorId;
        }
    }

    @Override
    public void setPagination(Pagination pagination) {
        this.currentPagination = pagination;
    }

    @Override
    public String getPaginationParamValue(PageParam pageParam) {
        return currentPagination.getParamValue(pageParam);
    }
}
