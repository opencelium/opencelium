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
import org.jruby.embed.LocalContextScope;
import org.jruby.embed.ScriptingContainer;
import org.springframework.stereotype.Component;

import java.util.List;
import java.util.Map;
import java.util.function.Function;
import java.util.stream.Collectors;

@Component
public class JRubyEngine implements ScriptEngine {

    private final ObjectMapper mapper = new ObjectMapper();

    /**
     * The script’s output must be assigned to a variable named {@code RESULT_VAR}, by convention.
     * Example:
     * <pre>
     * def run
     *   return 42
     * end
     *
     * RESULT_VAR = run
     * </pre>
     */
    private final String RESULT_VARIABLE = "RESULT_VAR";

    @Override
    public boolean supports(Language lang) {
        return lang != null
                && lang.getLanguage() == LanguageType.RUBY
                && lang.getEngine() == ScriptEngineType.JRUBY;
    }

    @Override
    public Object execute(String script) throws ScriptExecutionException, InvalidScriptException {
        return execute(script, null);
    }

    @Override
    public Object execute(String script, Map<String, Object> bindings) throws ScriptExecutionException, InvalidScriptException {
        ScriptingContainer container = new ScriptingContainer(LocalContextScope.SINGLETHREAD);
        try {
            bindArgs(container, bindings);

            container.runScriptlet(script);

            Object result = container.get(RESULT_VARIABLE);

            return translateResult(result);
        } catch (Exception e) {
            throw new ScriptExecutionException("Ruby script execution error: " + e.getMessage(), e);
        } finally {
            container.terminate();
        }
    }

    @Override
    public Object execute(String script, Map<String, String> bindings, Function<String, Object> refExtractor) throws ScriptExecutionException, InvalidScriptException {
        ScriptingContainer container = new ScriptingContainer(LocalContextScope.SINGLETHREAD);
        try {
            bindArgs(container, bindings, refExtractor);

            container.runScriptlet(script);

            Object result = container.get(RESULT_VARIABLE);

            return translateResult(result);
        } catch (Exception e) {
            throw new ScriptExecutionException("Execution failed: " + e.getMessage(), e);
        } finally {
            container.terminate();
        }
    }

    @Override
    public void validate(String script) throws InvalidScriptException {
        ScriptingContainer container = new ScriptingContainer(LocalContextScope.SINGLETHREAD);
        try {
            container.parse(script); // just checks syntax
        } catch (Exception e) {
            throw new InvalidScriptException("Invalid Ruby script: " + e.getMessage(), e);
        } finally {
            container.terminate();
        }
    }

    @Override
    public boolean isUp() {
        return true;
    }

    private void bindArgs(ScriptingContainer container, Map<String, Object> bindings) {
        if (bindings != null) {
            bindings.forEach((key, val) -> {
                if (val instanceof Map || val instanceof List) {
                    try {
                        String json = mapper.writeValueAsString(val);

                        json = json.replace("__oc__attributes.", "@")
                                .replace(".__oc__value", "");

                        val = json.trim().startsWith("[")
                                ? mapper.readValue(json, List.class)
                                : mapper.readValue(json, Map.class);
                    } catch (JsonProcessingException e) {
                        throw new ScriptExecutionException("Failed to bind JSON value", e);
                    }
                }
                container.put(key, val);
            });
        }
    }

    private void bindArgs(ScriptingContainer container, Map<String, String> args, Function<String, Object> referenceExtractor) {
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

        bindArgs(container, resultMap);
    }

    private Object translateResult(Object rubyResult) {
        if (rubyResult == null) {
            return null;
        }

        if (rubyResult instanceof String || rubyResult instanceof Number || rubyResult instanceof Boolean) {
            return rubyResult;
        }

        try {
            String json = mapper.writeValueAsString(rubyResult);
            if (json.trim().startsWith("[")) {
                return mapper.readValue(json, List.class);
            } else {
                return mapper.readValue(json, new TypeReference<Map<String, Object>>() {
                });
            }
        } catch (JsonProcessingException e) {
            throw new ScriptExecutionException("Failed to parse Ruby result", e);
        }
    }
}
