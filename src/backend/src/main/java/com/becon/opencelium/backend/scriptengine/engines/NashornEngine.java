package com.becon.opencelium.backend.scriptengine.engines;

import com.becon.opencelium.backend.scriptengine.*;
import com.becon.opencelium.backend.scriptengine.ex.InvalidScriptException;
import com.becon.opencelium.backend.scriptengine.ex.ScriptExecutionException;
import com.fasterxml.jackson.core.JsonProcessingException;
import com.fasterxml.jackson.core.type.TypeReference;
import com.fasterxml.jackson.databind.ObjectMapper;
import jakarta.annotation.PostConstruct;
import org.openjdk.nashorn.api.scripting.JSObject;
import org.openjdk.nashorn.api.scripting.NashornScriptEngineFactory;
import org.openjdk.nashorn.api.scripting.ScriptObjectMirror;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.stereotype.Component;

import javax.script.Compilable;
import javax.script.ScriptContext;
import javax.script.ScriptEngineManager;
import javax.script.ScriptException;
import java.io.Writer;
import java.time.Duration;
import java.util.AbstractMap;
import java.util.HashMap;
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

    /**
     * Engine options for sandboxed runs: no access to Java packages or classes.
     */
    private static final String[] SANDBOX_OPTIONS = {"--no-java"};

    /**
     * Removes the globals that reach outside a sandboxed script: loading local or remote code
     * and terminating the JVM.
     */
    private static final String SANDBOX_CLEANUP =
            "delete this.load; delete this.loadWithNewGlobal; delete this.quit; delete this.exit;";

    private static final Logger LOGGER = LoggerFactory.getLogger(NashornEngine.class);

    /**
     * Uses what scripts commonly use - loops, functions, strings, regular expressions, numbers,
     * exceptions, JSON and dates - with an object binding and an object result, so that {@link
     * #warmUp()} runs through the same Nashorn and conversion code as a real script.
     */
    private static final String WARM_UP_SCRIPT = """
            var names = [];
            var total = 0;
            for (var i = 0; i < data.length; i++) {
              names.push(String(data[i].name).trim().toUpperCase().replace(/\\s+/g, '-'));
              total += Math.round(parseFloat(data[i].price) * data[i].amount);
            }
            try {
              JSON.parse('{');
            } catch (e) {
              names.push(typeof e.message);
            }
            ({names: names.filter(function (name) { return name.length > 0; }), total: total,
              day: new Date(Date.UTC(2026, 0, 2)).toISOString().substring(0, 10)});
            """;

    private static final Map<String, Object> WARM_UP_BINDINGS =
            Map.of("data", List.of(Map.of("name", " warm up ", "price", "1.5", "amount", 2)));

    private static final Map<String, Object> WARM_UP_RESULT =
            Map.of("names", List.of("WARM-UP", "string"), "total", 3, "day", "2026-01-02");

    private final ObjectMapper mapper = new ObjectMapper();

    /**
     * Used for creating sandboxed engine instances
     */
    private final NashornScriptEngineFactory sandboxFactory = new NashornScriptEngineFactory();

    /**
     * Used only for creating the compiling engine; scripts are executed in sandboxed engines
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
     * Runs a script once, the way an execution runs one, while the application starts.
     *
     * <p>A script that runs too long is stopped with {@link Thread#stop()}. Nashorn initialises
     * most of its classes during the first script it runs, and a stop that falls into the static
     * initialiser of one of them leaves that class failed for the whole JVM: every later script
     * fails with {@link NoClassDefFoundError} until a restart. Nothing stops the thread that
     * starts the application, so the classes this script needs are initialised safely here. A
     * built-in that no script has used yet is still initialised by the first script that uses it.
     */
    @PostConstruct
    public void warmUp() {
        long start = System.nanoTime();
        try {
            Object result = executeSandboxed(WARM_UP_SCRIPT, WARM_UP_BINDINGS, Writer.nullWriter());
            if (!WARM_UP_RESULT.equals(result)) {
                LOGGER.warn("The Nashorn warm-up script gave {} instead of {}", result, WARM_UP_RESULT);
                return;
            }
            LOGGER.debug("Nashorn warmed up in {} ms", Duration.ofNanos(System.nanoTime() - start).toMillis());
        } catch (ScriptExecutionException | InvalidScriptException e) {
            LOGGER.warn("The Nashorn warm-up script failed; JavaScript enhancements may fail too", e);
        }
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
     * Executes a script with optional bindings in the same sandbox as
     * {@link #executeSandboxed(String, Map, Writer)}, discarding what the script prints.
     * Handles primitives, Strings, and JSON-serializable Maps/Lists.
     */
    @Override
    public Object execute(String script, Map<String, Object> bindings) throws ScriptExecutionException, InvalidScriptException {
        return executeSandboxed(script, bindings, Writer.nullWriter());
    }

    /**
     * Resolves each binding through {@code referenceExtractor} and executes the script in the same
     * sandbox as {@link #executeSandboxed(String, Map, Writer)}, discarding what the script prints.
     */
    @Override
    public Object execute(String script, Map<String, String> bindings, Function<String, Object> referenceExtractor) throws ScriptExecutionException, InvalidScriptException {
        try {

            // Creates new engine for each execution
            javax.script.ScriptEngine engine = createSandboxEngine(Writer.nullWriter());

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
     * Executes a script in a sandbox: the script cannot reach Java classes, load other code or
     * terminate the JVM. Bindings and the result are converted exactly as in
     * {@link #execute(String, Map)}, so a script yields the same result here as in an execution.
     *
     * @param script the script to execute
     * @param bindings variable names and values to inject; may be {@code null}
     * @param output receives what the script writes with {@code print}
     * @return the result of the script
     * @throws ScriptExecutionException if the script fails or its result cannot be converted
     */
    public Object executeSandboxed(String script, Map<String, Object> bindings, Writer output)
            throws ScriptExecutionException, InvalidScriptException {
        try {
            javax.script.ScriptEngine engine = createSandboxEngine(output);

            bindArgs(engine, bindings);

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

        Map<String, Object> resultMap = new HashMap<>(args.size());

        for (Map.Entry<String, String> entry : args.entrySet()) {
            try {
                Object value = referenceExtractor.apply(entry.getValue());
                resultMap.put(entry.getKey(), value);
            } catch (Exception e) {
                throw new ScriptExecutionException(e.getMessage(), e);
            }
        }

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

    private javax.script.ScriptEngine createSandboxEngine(Writer output) throws ScriptException {
        javax.script.ScriptEngine engine = sandboxFactory.getScriptEngine(
                SANDBOX_OPTIONS, NashornEngine.class.getClassLoader(), className -> false);
        engine.eval(SANDBOX_CLEANUP);

        ScriptContext context = engine.getContext();
        context.setWriter(output);
        context.setErrorWriter(output);
        return engine;
    }

    private Compilable initCompilatorEngine() {
        javax.script.ScriptEngine engine = engineManager.getEngineByName("nashorn");

        return engine instanceof Compilable comp ? comp : null;
    }
}
