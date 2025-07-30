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
import java.util.regex.Matcher;
import java.util.regex.Pattern;

/**
 * Implementation of ScriptEngine for executing JavaScript using the Nashorn engine.
 */
@Component
public class NashornEngine implements ScriptEngine {

    private final ObjectMapper mapper = new ObjectMapper();
    private final LangViolenceCheker jsViolationChecker = LangViolenceChekerFactory.get(LanguageType.JS);

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
            jsViolationChecker.check(script);

            ScriptEngineManager manager = new ScriptEngineManager();
            javax.script.ScriptEngine engine = manager.getEngineByName("nashorn");

            if (bindings != null && !bindings.isEmpty()) {
                bindings.forEach((varName, value) -> {
                    if (value instanceof Map || value instanceof List) {
                        // Serialize complex structures and parse via JSON.parse
                        String stringVal = stringify(value);
                        engine.put("dataModel", stringVal);
                        JSObject obj = (JSObject) evaluate(engine, "JSON.parse(dataModel)");
                        engine.put(varName, obj);
                    } else {
                        // Inject primitives and strings as-is
                        engine.put(varName, value);
                    }
                });
            }

            Object result = evaluate(engine, script);

            boolean isPrimitive = result instanceof Number || result instanceof String || result instanceof Boolean;
            if (result == null || isPrimitive) {
                return result;
            }

            // Check if result is an array
            boolean isArray = ((ScriptObjectMirror) result).isArray();

            ScriptObjectMirror JSON = (ScriptObjectMirror) evaluate(engine, "JSON");
            String stringifiedResult = JSON.callMember("stringify", result).toString();

            if (isArray) {
                // Validate JSON array syntax
                String arrayRegex = "\\[(.*?)]";
                final Pattern pattern = Pattern.compile(arrayRegex, Pattern.MULTILINE);
                final Matcher matcher = pattern.matcher(stringifiedResult);
                if (!matcher.matches()) {
                    throw new ScriptExecutionException("Invalid array result: " + stringifiedResult);
                }

                return mapper.readValue(stringifiedResult, List.class);
            } else {
                // Convert JSON object to Java Map
                return mapper.readValue(stringifiedResult, new TypeReference<Map<String, Object>>() {
                });
            }
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

        jsViolationChecker.check(script);

        ScriptEngineManager manager = new ScriptEngineManager();
        javax.script.ScriptEngine engine = manager.getEngineByName("nashorn");

        if (!(engine instanceof Compilable compilable)) {
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
}
