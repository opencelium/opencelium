package com.becon.opencelium.backend.polygot_engine.engines.nashorn;

import com.becon.opencelium.backend.polygot_engine.*;
import com.becon.opencelium.backend.polygot_engine.ex.InvalidScriptException;
import com.becon.opencelium.backend.polygot_engine.ex.ScriptExecutionException;
import com.fasterxml.jackson.core.JsonProcessingException;
import com.fasterxml.jackson.core.type.TypeReference;
import com.fasterxml.jackson.databind.ObjectMapper;
import org.openjdk.nashorn.api.scripting.JSObject;
import org.openjdk.nashorn.api.scripting.ScriptObjectMirror;
import org.springframework.stereotype.Component;

import javax.script.Compilable;
import javax.script.ScriptEngineManager;
import javax.script.ScriptException;
import java.util.List;
import java.util.Map;
import java.util.function.Function;
import java.util.regex.Pattern;
import java.util.stream.Collectors;

/**
 * Implementation of ScriptEngine for executing JavaScript using the Nashorn engine.
 */
@Component
public class NashornEngine implements ScriptEngine {

    private static final Pattern arrayPattern = Pattern.compile("\\[(.*?)]", Pattern.MULTILINE);

    private final ObjectMapper mapper = new ObjectMapper();

    /**
     * Used for creating engine instances
     */
    private final ScriptEngineManager engineManager = new ScriptEngineManager();

    /**
     * Used for compiling scripts. Since the engine doesn't use a certain context for each compliance we can use one engine to compile scripts
     */
    private final Compilable compilable;

    public NashornEngine() {

        // Initialize 'compilator' engine
        this.compilable = initCompilatorEngine();
    }

    /**
     * Checks if this engine supports the provided language and engine type.
     */
    @Override
    public boolean supports(Language lang) {
        return lang != null
                && lang.getLanguage() == LanguageType.JS
                && lang.getEngine() == ScriptEngineType.NASHORN;
    }

    /**
     * Executes a script without bindings.
     */
    @Override
    public Object execute(String script) throws ScriptExecutionException, InvalidScriptException {
        return execute(script, null);
    }

    /**
     * Executes a script with optional bindings.
     * Handles primitives, Strings, and JSON-serializable Maps/Lists.
     */
    @Override
    public Object execute(String script, Map<String, Object> bindings) throws ScriptExecutionException, InvalidScriptException {
        try {

            // Creates new engine for each execution
            javax.script.ScriptEngine engine = engineManager.getEngineByName("nashorn");

            bindArgs(engine, bindings);

            Object result = evaluate(engine, script);

            return translateResult(result, engine);
        } catch (ScriptExecutionException | InvalidScriptException e) {
            throw e;
        } catch (Exception e) {
            throw new ScriptExecutionException("Unknown error: " + e.getMessage(), e);
        }
    }

    @Override
    public Object execute(String script, Map<String, String> bindings, Function<String, Object> referenceExtractor) throws ScriptExecutionException, InvalidScriptException {
        try {

            // Creates new engine for each execution
            javax.script.ScriptEngine engine = engineManager.getEngineByName("nashorn");

            bindArgs(engine, bindings, referenceExtractor);

            Object result = evaluate(engine, script);

            return translateResult(result, engine);
        } catch (ScriptExecutionException | InvalidScriptException e) {
            throw e;
        } catch (Exception e) {
            throw new ScriptExecutionException("Unknown error: " + e.getMessage(), e);
        }
    }

    /**
     * Validates a script for syntax errors without executing it.
     */
    @Override
    public void validate(String script) throws InvalidScriptException {
        if (compilable == null) {
            // It is not possible to check syntax errors if engine is not Compilable

            return;
        }

        try {
            compilable.compile(script); // Try compiling to detect syntax errors
        } catch (ScriptException e) {
            throw new InvalidScriptException(e.getMessage(), e);
        } catch (Exception e) {
            throw new InvalidScriptException("Invalid script '" + script + "'", e);
        }
    }

    /**
     * Always returns true. Used for health checks.
     */
    @Override
    public boolean isUp() {
        return true;
    }

    /**
     * Converts a Java object to its JSON string representation.
     */
    private String stringify(Object value) {
        try {
            return mapper.writeValueAsString(value);
        } catch (JsonProcessingException e) {
            // This should never happen

            throw new ScriptExecutionException("Unknown error", e);
        }
    }

    /**
     * Evaluates the given code using the provided script engine.
     */
    private Object evaluate(javax.script.ScriptEngine engine, String code) {
        try {
            return engine.eval(code);
        } catch (ScriptException e) {
            throw new ScriptExecutionException(e.getMessage(), e);
        } catch (Exception e) {
            throw new ScriptExecutionException("Unknown error : " + e.getMessage(), e);
        }
    }

    private void bindArgs(javax.script.ScriptEngine engine, Map<String, String> args, Function<String, Object> referenceExtractor) {
        Map<String, Object> resultMap = args.entrySet().stream()
                .map(entry -> {
                    try {
                        Object value = referenceExtractor.apply(entry.getValue());

                        return Map.entry(entry.getKey(), value);
                    } catch (Exception e) {
                        throw new ScriptExecutionException("Reference extracting error: " + e.getMessage(), e);
                    }
                })
                .collect(Collectors.toMap(Map.Entry::getKey, Map.Entry::getValue));

        bindArgs(engine, resultMap);
    }

    private void bindArgs(javax.script.ScriptEngine engine, Map<String, Object> bindings) {
        if (bindings != null && !bindings.isEmpty()) {
            bindings.forEach((varName, value) -> {
                if (value instanceof Map || value instanceof List) {
                    // Serialize complex structures and parse via JSON.parse
                    String stringVal = stringify(value);

                    // replace | remove 'xml' related attributes
                    stringVal = stringVal.replace("__oc__attributes.", "@").replace(".__oc__value", "");

                    engine.put("dataModel", stringVal);
                    JSObject obj = (JSObject) evaluate(engine, "JSON.parse(dataModel)");
                    engine.put(varName, obj);
                } else {
                    // Inject primitives and strings as-is
                    engine.put(varName, value);
                }
            });
        }
    }

    private Object translateResult(Object result, javax.script.ScriptEngine engine) {
        boolean isPrimitive = result instanceof Number || result instanceof String || result instanceof Boolean;
        if (result == null || isPrimitive) {
            return result;
        }

        // Check if result is an array
        boolean isArray = ((ScriptObjectMirror) result).isArray();

        ScriptObjectMirror JSON = (ScriptObjectMirror) evaluate(engine, "JSON");
        String stringifiedResult = JSON.callMember("stringify", result).toString();

        try {
            if (isArray) {
                // Validate JSON array syntax
                if (!arrayPattern.matcher(stringifiedResult).matches()) {
                    throw new ScriptExecutionException("Invalid array result: " + stringifiedResult);
                }

                return mapper.readValue(stringifiedResult, List.class);
            } else {
                // Convert JSON object to Java Map
                return mapper.readValue(stringifiedResult, new TypeReference<Map<String, Object>>() {
                });
            }
        } catch (JsonProcessingException e) {
            throw new ScriptExecutionException("Cannot read a result of nashorn: " + stringifiedResult, e);
        }
    }

    private Compilable initCompilatorEngine() {
        javax.script.ScriptEngine engine = engineManager.getEngineByName("nashorn");

        return engine instanceof Compilable comp ? comp : null;
    }
}
