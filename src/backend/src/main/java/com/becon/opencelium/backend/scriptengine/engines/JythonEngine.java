package com.becon.opencelium.backend.scriptengine.engines;

import com.becon.opencelium.backend.scriptengine.Language;
import com.becon.opencelium.backend.scriptengine.LanguageType;
import com.becon.opencelium.backend.scriptengine.ScriptEngine;
import com.becon.opencelium.backend.scriptengine.ScriptEngineType;
import com.becon.opencelium.backend.scriptengine.ex.InvalidScriptException;
import com.becon.opencelium.backend.scriptengine.ex.ScriptExecutionException;
import com.fasterxml.jackson.core.JsonProcessingException;
import com.fasterxml.jackson.core.type.TypeReference;
import com.fasterxml.jackson.databind.ObjectMapper;
import org.python.core.Py;
import org.python.core.PyObject;
import org.python.util.PythonInterpreter;
import org.springframework.stereotype.Component;

import java.util.List;
import java.util.Map;
import java.util.function.Function;
import java.util.stream.Collectors;

@Component
public class JythonEngine implements ScriptEngine {

    private final ObjectMapper mapper = new ObjectMapper();

    /**
     * The script's output must be assigned to a variable named {@code result}, by convention.
     * <p>
     * Example:
     * <pre>
     * def run():
     *     return 42
     *
     * result = run()
     * </pre>
     */
    private final String RESULT_VARIABLE = "result";

    @Override
    public boolean supports(Language lang) {
        return lang != null
                && lang.getLanguage() == LanguageType.PYTHON_2
                && lang.getEngine() == ScriptEngineType.JYTHON;
    }

    @Override
    public Object execute(String script) throws ScriptExecutionException, InvalidScriptException {
        return execute(script, null);
    }

    @Override
    public Object execute(String script, Map<String, Object> bindings) throws ScriptExecutionException, InvalidScriptException {
        try (PythonInterpreter interpreter = new PythonInterpreter()) {
            bindArgs(interpreter, bindings);

            interpreter.exec(script);

            // Convention: result is in variable `result`
            PyObject pyResult = interpreter.get(RESULT_VARIABLE);

            return translateResult(pyResult);
        } catch (ScriptExecutionException | InvalidScriptException e) {
            throw e;
        } catch (Exception e) {
            throw new ScriptExecutionException("Script execution error: " + e.getMessage(), e);
        }
    }

    @Override
    public Object execute(String script, Map<String, String> bindings, Function<String, Object> refExtractor) throws ScriptExecutionException, InvalidScriptException {
        try (PythonInterpreter interpreter = new PythonInterpreter()) {
            bindArgs(interpreter, bindings, refExtractor);

            interpreter.exec(script);

            // Convention: result is in variable `result`
            PyObject pyResult = interpreter.get(RESULT_VARIABLE);

            return translateResult(pyResult);
        } catch (Exception e) {
            throw new ScriptExecutionException("Execution failed: " + e.getMessage(), e);
        }
    }

    /**
     * Validates that a script can be compiled without executing it.
     * Throws InvalidScriptException if syntax is invalid.
     */
    @Override
    public void validate(String script) throws InvalidScriptException {
        try (PythonInterpreter interpreter = new PythonInterpreter()) {
            interpreter.compile(script); // Validate syntax
        } catch (Exception e) {
            throw new InvalidScriptException("Invalid script: " + e.getMessage(), e);
        }
    }

    @Override
    public boolean isUp() {
        return true;
    }

    private void bindArgs(PythonInterpreter interpreter, Map<String, Object> bindings) {
        if (bindings != null) {
            bindings.forEach((key, val) -> {
                if (val instanceof Map || val instanceof List) {
                    try {
                        // 1. Serialize to JSON
                        String json = mapper.writeValueAsString(val);

                        // 2. Replace XML-like keys
                        json = json.replace("__oc__attributes.", "@")
                                .replace(".__oc__value", "");

                        // 3. Deserialize back to Java structure
                        val = json.trim().startsWith("[")
                                ? mapper.readValue(json, List.class)
                                : mapper.readValue(json, Map.class);
                    } catch (JsonProcessingException e) {
                        // This will never happen

                        throw new ScriptExecutionException("Unknown error", e);
                    }

                    // 4. Convert to PyObject and inject
                    interpreter.set(key, Py.java2py(val));
                } else {

                    // Primitive or raw object
                    interpreter.set(key, val);
                }
            });
        }
    }

    private void bindArgs(PythonInterpreter interpreter, Map<String, String> args, Function<String, Object> referenceExtractor) {
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

        bindArgs(interpreter, resultMap);
    }

    /**
     * Converts the result from a PyObject to a Java-friendly format:
     * - Primitives are returned as-is
     * - Objects/lists are serialized to JSON and deserialized to Map/List
     */
    private Object translateResult(PyObject pyResult) {
        if (pyResult == null) {
            return null;
        }

        Object javaObj = pyResult.__tojava__(Object.class);

        if (javaObj instanceof String || javaObj instanceof Number || javaObj instanceof Boolean) {
            return javaObj;
        }

        try {
            String json = mapper.writeValueAsString(javaObj);
            if (json.trim().startsWith("[")) {
                return mapper.readValue(json, List.class);
            } else {
                return mapper.readValue(json, new TypeReference<Map<String, Object>>() {
                });
            }
        } catch (JsonProcessingException e) {
            throw new ScriptExecutionException("Failed to parse the result", e);
        }
    }
}
