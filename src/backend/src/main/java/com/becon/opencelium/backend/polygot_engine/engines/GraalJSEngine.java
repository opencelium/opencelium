package com.becon.opencelium.backend.polygot_engine.engines;

import com.becon.opencelium.backend.polygot_engine.*;
import com.becon.opencelium.backend.polygot_engine.Language;
import com.becon.opencelium.backend.polygot_engine.ex.InvalidScriptException;
import com.becon.opencelium.backend.polygot_engine.ex.ScriptExecutionException;
import com.fasterxml.jackson.core.JsonProcessingException;
import com.fasterxml.jackson.core.type.TypeReference;
import com.fasterxml.jackson.databind.ObjectMapper;
import org.springframework.stereotype.Component;
import org.graalvm.polyglot.*;

import java.util.List;
import java.util.Map;
import java.util.function.Function;

@Component
public class GraalJSEngine implements ScriptEngine {

    private final ObjectMapper mapper = new ObjectMapper();

    @Override
    public boolean supports(Language lang) {
        return lang != null
                && lang.getLanguage() == LanguageType.JS
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
            Value result = context.eval("js", script);
            return translateResult(result);
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
            Map<String, Object> resolvedBindings = bindings.entrySet().stream()
                    .collect(java.util.stream.Collectors.toMap(
                            Map.Entry::getKey,
                            e -> referenceExtractor.apply(e.getValue())
                    ));
            bindArgs(context, resolvedBindings);
            Value result = context.eval("js", script);
            return translateResult(result);
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
            context.parse("js", script);
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
                return context.getEngine().getLanguages().keySet().stream().anyMatch("js"::equals);
            }
        }

        // If it is not GraalVM then no checks are needed
        return true;
    }

    private Context newContext() {
        return Context.newBuilder("js")
                .allowAllAccess(false)
                .build();
    }

    private void bindArgs(Context context, Map<String, Object> bindings) {
        if (bindings != null && !bindings.isEmpty()) {
            Value jsBindings = context.getBindings("js");
            bindings.forEach((varName, value) -> {
                if (value instanceof Map || value instanceof List) {
                    try {
                        String stringVal = mapper.writeValueAsString(value)
                                .replace("__oc__attributes.", "@")
                                .replace(".__oc__value", "");
                        Value parsed = context.eval("js", "JSON.parse('" + escapeJsString(stringVal) + "')");
                        jsBindings.putMember(varName, parsed);
                    } catch (JsonProcessingException e) {
                        throw new ScriptExecutionException("Error serializing binding: " + varName, e);
                    }
                } else {
                    jsBindings.putMember(varName, value);
                }
            });
        }
    }

    private Object translateResult(Value result) {
        if (result == null || result.isNull()) return null;
        if (result.isNumber()) return result.as(Number.class);
        if (result.isBoolean()) return result.asBoolean();
        if (result.isString()) return result.asString();
        try {
            String json = contextJsonStringify(result);
            if (result.hasArrayElements()) {
                return mapper.readValue(json, List.class);
            } else {
                return mapper.readValue(json, new TypeReference<Map<String, Object>>() {
                });
            }
        } catch (JsonProcessingException e) {
            throw new ScriptExecutionException("Cannot parse result", e);
        }
    }

    private String contextJsonStringify(Value result) {
        try (Context ctx = newContext()) {
            Value json = ctx.eval("js", "JSON");
            return json.invokeMember("stringify", result).asString();
        }
    }

    private String escapeJsString(String str) {
        return str.replace("\\", "\\\\").replace("'", "\\'");
    }
}
