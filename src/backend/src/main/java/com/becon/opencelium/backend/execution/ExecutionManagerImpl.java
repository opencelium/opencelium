package com.becon.opencelium.backend.execution;

import com.becon.opencelium.backend.constant.RegExpression;
import com.becon.opencelium.backend.enums.PageParam;
import com.becon.opencelium.backend.enums.RelationalOperator;
import com.becon.opencelium.backend.exception.GlobalVariableNotFoundException;
import com.becon.opencelium.backend.exception.ReferenceNotFoundException;
import com.becon.opencelium.backend.execution.globalvariable.GlobalLoopSource;
import com.becon.opencelium.backend.execution.globalvariable.GlobalValueCaster;
import com.becon.opencelium.backend.execution.globalvariable.GlobalValueResolver;
import com.becon.opencelium.backend.execution.globalvariable.GlobalVariableSnapshot;
import com.becon.opencelium.backend.execution.globalvariable.GlobalVariableWriter;
import com.becon.opencelium.backend.execution.logger.OcLogger;
import com.becon.opencelium.backend.execution.logger.ThreadLocalOcLogger;
import com.becon.opencelium.backend.execution.logger.msg.ExecutionLog;
import com.becon.opencelium.backend.execution.oc721.Extractor;
import com.becon.opencelium.backend.execution.oc721.Loop;
import com.becon.opencelium.backend.execution.oc721.Operation;
import com.becon.opencelium.backend.execution.oc721.ReferenceExtractor;
import com.becon.opencelium.backend.invoker.entity.Pagination;
import com.becon.opencelium.backend.reference.GlobalEscape;
import com.becon.opencelium.backend.reference.ReferenceDetector;
import com.becon.opencelium.backend.reference.ReferenceMatchers;
import com.becon.opencelium.backend.reference.ReferenceScanner;
import com.becon.opencelium.backend.reference.model.GlobalReference;
import com.becon.opencelium.backend.resource.execution.EnhancementEx;
import com.becon.opencelium.backend.resource.execution.FieldBindEx;
import com.becon.opencelium.backend.scriptengine.LanguageType;
import com.becon.opencelium.backend.scriptengine.ScriptEngine;
import com.becon.opencelium.backend.scriptengine.ScriptExecutionManager;
import com.becon.opencelium.backend.scriptengine.ScriptExecutionManagerProvider;
import com.fasterxml.jackson.core.JsonProcessingException;
import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.web.client.RestTemplate;

import java.util.ArrayList;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;
import java.util.Objects;
import java.util.Optional;
import java.util.UUID;
import java.util.function.Function;
import java.util.regex.Matcher;
import java.util.regex.Pattern;
import java.util.stream.Collectors;

public class ExecutionManagerImpl implements ExecutionManager {
    // the target of a global variable write: global.name, without braces or path
    private static final Pattern GLOBAL_TARGET = Pattern.compile(RegExpression.globalWriteTarget);
    private static final ObjectMapper LITERAL_JSON = new ObjectMapper();

    private static final Logger log = LoggerFactory.getLogger(ExecutionManagerImpl.class);

    // substituted for a reference whose data has never been produced
    private static final String MISSING_REFERENCE_VALUE = "";

    private final Map<String, Object> webhookVars;
    private final Map<Integer, Map<String, String>> requestData;
    private final Map<Integer, RestTemplate> restTemplate;
    private final Map<Integer, Pagination> pagination;
    // the run's own copy of the values: a write by the run replaces it
    private GlobalVariableSnapshot globalSnapshot;
    private final GlobalVariableWriter.Run globalWriter;
    private final Extractor refExtractor;
    private final List<Loop> loops = new ArrayList<>();
    private final List<FieldBindEx> fieldBind;
    private final List<Operation> operations = new ArrayList<>();
    private Integer currentConnectorId;
    private Pagination currentPagination;

    public ExecutionManagerImpl(
            Map<String, Object> webhookVars,
            List<FieldBindEx> fieldBind,
            Map<Integer, Map<String, String>> requestData,
            Map<Integer, RestTemplate> restTemplate,
            Map<Integer, Pagination> pagination
    ) {
        this(webhookVars, fieldBind, requestData, restTemplate, pagination, ReferenceExtractor::new);
    }

    /**
     * Creates a manager that resolves references with the extractor {@code extractorFactory} builds
     * for it, instead of the default {@link ReferenceExtractor}.
     *
     * <p>Used by the single-method test to put static values in place of the references that point
     * to data the test does not produce.
     */
    public ExecutionManagerImpl(
            Map<String, Object> webhookVars,
            List<FieldBindEx> fieldBind,
            Map<Integer, Map<String, String>> requestData,
            Map<Integer, RestTemplate> restTemplate,
            Map<Integer, Pagination> pagination,
            Function<ExecutionManager, Extractor> extractorFactory
    ) {
        this(webhookVars, fieldBind, requestData, restTemplate, pagination, GlobalVariableSnapshot.empty(),
                extractorFactory);
    }

    /**
     * Creates a manager that also resolves global variables, from the snapshot the run took when
     * it started, and writes none.
     */
    public ExecutionManagerImpl(
            Map<String, Object> webhookVars,
            List<FieldBindEx> fieldBind,
            Map<Integer, Map<String, String>> requestData,
            Map<Integer, RestTemplate> restTemplate,
            Map<Integer, Pagination> pagination,
            GlobalVariableSnapshot globalSnapshot,
            Function<ExecutionManager, Extractor> extractorFactory
    ) {
        this(webhookVars, fieldBind, requestData, restTemplate, pagination, globalSnapshot, null, extractorFactory);
    }

    /**
     * Creates a manager that resolves global variables from the snapshot the run took when it
     * started and writes mutable variables through {@code globalWriter}.
     *
     * @param globalWriter writes the mutable variables of the run; {@code null} for a run that
     *                     may write none
     */
    public ExecutionManagerImpl(
            Map<String, Object> webhookVars,
            List<FieldBindEx> fieldBind,
            Map<Integer, Map<String, String>> requestData,
            Map<Integer, RestTemplate> restTemplate,
            Map<Integer, Pagination> pagination,
            GlobalVariableSnapshot globalSnapshot,
            GlobalVariableWriter.Run globalWriter,
            Function<ExecutionManager, Extractor> extractorFactory
    ) {
        this.globalWriter = globalWriter;
        this.webhookVars = webhookVars;
        this.fieldBind = fieldBind;
        this.requestData = requestData;
        this.restTemplate = restTemplate;
        this.pagination = pagination;
        this.globalSnapshot = Objects.requireNonNull(globalSnapshot, "globalSnapshot");

        this.refExtractor = extractorFactory.apply(this);
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

        ScriptExecutionManager scriptExecutionManager = ScriptExecutionManagerProvider.get();
        ScriptEngine scriptEngine = scriptExecutionManager.resolveEngine(LanguageType.getByCode(enhancement.getLang()))
                .orElseThrow(() -> new RuntimeException("No engine is available for '%s' language".formatted(enhancement.getLang())));

        if (!scriptEngine.isUp()) {
            throw new RuntimeException("Currently, an engine is not up for '%s' language".formatted(enhancement.getLang()));
        }

        // ref("{{global.x}}") in the code becomes a variable bound like the other args, so the
        // engine resolves it through getValue and the script gets the value itself
        ReferenceScanner.BoundScript script =
                ReferenceScanner.bindScriptRefs(enhancement.getScript(), enhancement.getArgs());

        scriptEngine.validate(script.code());

        if (!ReferenceScanner.callsScriptSet(script.code())) {
            return scriptEngine.execute(script.code(), script.args(), this::getValue);
        }

        // set("{{global.x}}", value) records a write that is made once the script has finished
        if (LanguageType.getByCode(enhancement.getLang()) != LanguageType.JS) {
            throw new IllegalStateException("set() writes a global variable from JavaScript only, not from '%s'"
                    .formatted(enhancement.getLang()));
        }

        GlobalVariableWriter.ScriptSets.Outcome outcome = GlobalVariableWriter.ScriptSets.unwrap(
                scriptEngine.execute(GlobalVariableWriter.ScriptSets.wrap(script.code()), script.args(), this::getValue));
        for (GlobalVariableWriter.ScriptSets.Write write : outcome.writes()) {
            String name = GlobalVariableWriter.ScriptSets.nameOf(write.target())
                    .orElseThrow(() -> new IllegalStateException(
                            "set() writes to '%s', which is not {{global.name}}".formatted(write.target())));
            writeGlobal(name, write.value());
        }

        return outcome.result();
    }

    @Override
    public void writeGlobal(String name, Object value) {
        // like a read, a write reaches only the variables in the scope of the workflow
        if (globalSnapshot.find(name).isEmpty()) {
            throw new GlobalVariableNotFoundException(name);
        }
        if (globalWriter == null) {
            throw new IllegalStateException("This run cannot write global variable '" + name + "'");
        }

        JsonNode written = globalWriter.write(name, value);
        globalSnapshot = globalSnapshot.withValue(name, written);
    }

    @Override
    public void applyGlobalWrites(Map<String, String> writes, String source) {
        if (writes == null) {
            return;
        }

        for (Map.Entry<String, String> write : writes.entrySet()) {
            Matcher target = GLOBAL_TARGET.matcher(write.getKey() == null ? "" : write.getKey().strip());
            if (!target.matches()) {
                throw new IllegalStateException("'%s' writes to '%s', which is not global.name"
                        .formatted(source, write.getKey()));
            }

            writeGlobal(target.group(1), valueToWrite(write.getValue()));
        }
    }

    // a reference is resolved like any other value; anything else is JSON text, or plain text
    private Object valueToWrite(String value) {
        if (value == null) {
            return null;
        }
        if (ReferenceDetector.containsReference(value)) {
            return getValue(value);
        }

        try {
            return LITERAL_JSON.readValue(value, Object.class);
        } catch (JsonProcessingException e) {
            return value;
        }
    }

    @Override
    public Object getValue(String value) {
        // To trigger this method there should be at least one of 7 reference types in value:
        // ['directRef', 'wrappedDirectRef', 'enhancement', 'webhook', 'pageRef', 'globalRef', 'requestData'
        if (value == null) {
            return null;
        }

        // This method extracts 6 reference types:
        // ['wrappedDirectRef', 'enhancement', 'webhook', 'pageRef', 'globalRef', 'requestData'
        List<String> references = ReferenceScanner.extract(value);

        // There are 3 cases to skip following if:
        // 1) value == 'directRef': references.isEmpty() == true - we directly call refExtractor.extractValue(value)
        // 2) value is a complex reference (only 6 reference types): references.size() > 1
        // 3) value is a complex reference (only 6 reference types): references.size() == 1 but value is not a reference, it contains a reference
        if (!references.isEmpty() && (references.size() != 1 || !Objects.equals(value, references.get(0)))) {
            return resolveInText(value, references);
        }

        // nothing to resolve, only escaped global tokens: literal text that loses its backslash
        if (references.isEmpty() && GlobalEscape.isPresent(value) && !ReferenceDetector.containsReference(value)) {
            return GlobalEscape.unescape(value);
        }

        // at this point we could have simple 'directRef' or other 6 reference types
        return extractOrEmpty(value);
    }

    /**
     * Replaces every reference of a text that mixes text and references.
     *
     * <p>The value of a global variable is data and never a further reference. Its token is
     * therefore swapped for a slot before anything else is resolved, so a value another reference
     * brings in cannot name a global variable, and the slot is filled last, so no reference is
     * looked for inside the value. The slot carries a random marker no value can guess. A global
     * value is cast to text: a list or a map becomes compact JSON text. Every other reference is
     * resolved one after the other and keeps its {@code toString()} form, as before.
     *
     * <p>An escaped token, {@code \{{global.name}}}, takes a slot too, before the references do:
     * it stays untouched whatever is resolved around it and comes back without its backslash.
     */
    private String resolveInText(String text, List<String> references) {
        // slot -> the text that takes its place in the end
        Map<String, String> globalTexts = new LinkedHashMap<>();
        // this runs for every text that mixes text and references, so the random marker is only
        // made for a text that needs a slot
        boolean needsSlots = GlobalEscape.isPresent(text) || references.stream().anyMatch(ReferenceMatchers::isGlobal);
        String marker = needsSlots ? "\u0000" + UUID.randomUUID() + "#" : null;

        for (String escaped : GlobalEscape.tokensIn(text)) {
            String slot = marker + globalTexts.size() + "\u0000";
            globalTexts.put(slot, escaped.substring(1));
            text = text.replace(escaped, slot);
        }

        for (String ref : references) {
            if (!ReferenceMatchers.isGlobal(ref) || !text.contains(ref)) {
                continue;
            }

            String slot = marker + globalTexts.size() + "\u0000";
            globalTexts.put(slot, GlobalValueCaster.toText(extractOrEmpty(ref)));
            text = text.replace(ref, slot);
        }

        for (String ref : references) {
            if (ReferenceMatchers.isGlobal(ref)) {
                continue;
            }

            Object val = extractOrEmpty(ref);
            text = text.replace(ref, val == null ? "" : val.toString());
        }

        for (Map.Entry<String, String> slot : globalTexts.entrySet()) {
            text = text.replace(slot.getKey(), slot.getValue());
        }

        return text;
    }

    @Override
    public Object getGlobalValue(GlobalReference reference) {
        String path = reference.getPath().orElse(null);
        if (path == null || loops.isEmpty()) {
            return GlobalValueResolver.resolve(globalSnapshot, reference);
        }

        // inside a loop the path may name iterators: the token of a split, or an index or a key
        Optional<String> token = GlobalLoopSource.splitToken(path, loops);
        if (token.isPresent()) {
            return token.get();
        }

        return GlobalValueResolver.resolve(globalSnapshot, reference.getName(),
                GlobalLoopSource.withLoopValues(path, loops), reference.getRaw());
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
        OcLogger<ExecutionLog> logger = ThreadLocalOcLogger.get();
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
