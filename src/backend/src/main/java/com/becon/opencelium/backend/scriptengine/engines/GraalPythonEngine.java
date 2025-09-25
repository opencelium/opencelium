package com.becon.opencelium.backend.scriptengine.engines;

import com.becon.opencelium.backend.scriptengine.*;
import com.becon.opencelium.backend.scriptengine.Language;
import com.becon.opencelium.backend.scriptengine.ex.InvalidScriptException;
import com.becon.opencelium.backend.scriptengine.ex.ScriptExecutionException;
import com.fasterxml.jackson.core.JsonProcessingException;
import com.fasterxml.jackson.core.type.TypeReference;
import com.fasterxml.jackson.databind.ObjectMapper;
import org.graalvm.polyglot.*;
import org.springframework.stereotype.Component;

import java.util.*;
import java.util.function.Function;
import java.util.stream.Collectors;

@Component
public class GraalPythonEngine implements ScriptEngine {

    private final ObjectMapper mapper = new ObjectMapper();

    @Override
    public boolean supports(Language lang) {
        return lang != null
                && lang.getLanguage() == LanguageType.PYTHON_3
                && lang.getEngine() == ScriptEngineType.GRAALVM;
    }

    @Override
    public Object execute(String script) throws ScriptExecutionException, InvalidScriptException {
        return execute(script, null);
    }

    @Override
    public Object execute(String script, Map<String, Object> bindings) throws ScriptExecutionException, InvalidScriptException {
        try (Context context = newContext()) {
            bindArgs(context, bindings);
            Value result = context.eval("python", script);
            return translateResult(context, result);
        } catch (PolyglotException e) {
            if (e.isSyntaxError()) {
                throw new InvalidScriptException(e.getMessage(), e);
            }
            throw new ScriptExecutionException(e.getMessage(), e);
        } catch (Exception e) {
            throw new ScriptExecutionException("Unknown error: " + e.getMessage(), e);
        }
    }

    @Override
    public Object execute(String script, Map<String, String> bindings, Function<String, Object> referenceExtractor)
            throws ScriptExecutionException, InvalidScriptException {
        try (Context context = newContext()) {
            Map<String, Object> resolved = bindings.entrySet().stream()
                    .collect(Collectors.toMap(Map.Entry::getKey, e -> referenceExtractor.apply(e.getValue())));
            bindArgs(context, resolved);
            Value result = context.eval("python", script);
            return translateResult(context, result);
        } catch (PolyglotException e) {
            if (e.isSyntaxError()) {
                throw new InvalidScriptException(e.getMessage(), e);
            }
            throw new ScriptExecutionException(e.getMessage(), e);
        } catch (Exception e) {
            throw new ScriptExecutionException("Unknown error: " + e.getMessage(), e);
        }
    }

    @Override
    public void validate(String script) throws InvalidScriptException {
        try (Context context = newContext()) {
            context.parse("python", script);
        } catch (PolyglotException e) {
            if (e.isSyntaxError()) {
                throw new InvalidScriptException(e.getMessage(), e);
            }
            throw new InvalidScriptException("Invalid script: " + script, e);
        }
    }

    @Override
    public boolean isUp() {
        EngineHealthChecker healthChecker = EngineHealthCheckerFactory.getHealthChecker(ScriptEngineType.GRAALVM);

        if (healthChecker != null && healthChecker.check()) {
            // If it is GraalVM then python component must be installed

            try (Context context = Context.create()) {
                return context.getEngine().getLanguages().keySet().stream().anyMatch("python"::equals);
            }
        }

        // If it is not GraalVM then no checks are needed
        return true;
    }

    private Context newContext() {
        return Context.newBuilder("python")
                .allowAllAccess(false)
                .build();
    }

    private void bindArgs(Context context, Map<String, Object> bindings) {
        if (bindings == null || bindings.isEmpty()) return;
        Value pyBindings = context.getBindings("python");
        bindings.forEach((name, val) -> {
            if (val instanceof Map || val instanceof List) {
                try {
                    String json = mapper.writeValueAsString(val)
                            .replace("__oc__attributes.", "@")
                            .replace(".__oc__value", "");
                    // Use python's json.loads to convert string into python object
                    Value py = context.eval("python", "import json\njson.loads('" + escapePythonString(json) + "')");
                    pyBindings.putMember(name, py);
                } catch (JsonProcessingException e) {
                    throw new ScriptExecutionException("Error serializing binding: " + name, e);
                }
            } else {
                pyBindings.putMember(name, val);
            }
        });
    }

    private Object translateResult(Context context, Value result) {
        if (result == null || result.isNull()) return null;
        if (result.isBoolean()) return result.asBoolean();
        if (result.isNumber()) return result.as(Number.class);
        if (result.isString()) return result.asString();

        // For sequences and mappings, prefer JSON round-trip via Python json.dumps
        try {
            // Use a temporary python context to call json.dumps on the object
            Value json = context.eval("python", "import json\njson");
            String dumped = json.invokeMember("dumps", result).asString();
            // If it's an array/list in JSON -> List, otherwise Map
            if (dumped.trim().startsWith("[")) {
                return mapper.readValue(dumped, List.class);
            } else {
                return mapper.readValue(dumped, new TypeReference<Map<String, Object>>() {
                });
            }
        } catch (PolyglotException | JsonProcessingException e) {
            throw new ScriptExecutionException("Cannot convert Python result", e);
        }
    }

    private String escapePythonString(String s) {
        if (s == null) return "";
        return s.replace("\\", "\\\\").replace("'", "\\'").replace("\n", "\\n").replace("\r", "\\r");
    }
}
