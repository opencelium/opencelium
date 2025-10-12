package com.becon.opencelium.backend.scriptengine.engines;

import com.becon.opencelium.backend.proto.ScriptRequest;
import com.becon.opencelium.backend.scriptengine.Language;
import com.becon.opencelium.backend.scriptengine.LanguageType;
import com.becon.opencelium.backend.scriptengine.ScriptEngine;
import com.becon.opencelium.backend.scriptengine.ScriptEngineType;
import com.becon.opencelium.backend.scriptengine.ex.InvalidScriptException;
import com.becon.opencelium.backend.scriptengine.ex.ScriptExecutionException;
import com.becon.opencelium.backend.scriptengine.external.ExternalScriptExecutor;
import com.becon.opencelium.backend.scriptengine.external.polyglotservice.StructConverter;
import org.springframework.context.annotation.Scope;
import org.springframework.stereotype.Component;

import java.util.Map;
import java.util.UUID;
import java.util.function.Function;
import java.util.stream.Collectors;

@Component
@Scope("prototype")
public class PolyglotEngine implements ScriptEngine {

    private final ExternalScriptExecutor<ScriptRequest> polyglotExecutor;
    private LanguageType languageType;

    public PolyglotEngine(ExternalScriptExecutor<ScriptRequest> polyglotExecutor) {
        this.polyglotExecutor = polyglotExecutor;
    }

    @Override
    public boolean supports(Language lang) {
        //FIXME: use configured languages only
        return lang != null && lang.getEngine() == ScriptEngineType.POLYGOT_ENGINE;
    }

    @Override
    public Object execute(String script) throws ScriptExecutionException, InvalidScriptException {
        return execute(script, null);
    }

    @Override
    public Object execute(String script, Map<String, Object> bindings) throws ScriptExecutionException, InvalidScriptException {
        return polyglotExecutor.execute(buildScriptRequest(script, bindings));
    }

    @Override
    public Object execute(String script, Map<String, String> bindings, Function<String, Object> refExtractor) throws ScriptExecutionException, InvalidScriptException {
        return execute(script, extractArgs(bindings, refExtractor));
    }

    @Override
    public void validate(String script) throws InvalidScriptException {
        // TODO
    }

    @Override
    public boolean isUp() {
        return polyglotExecutor.isUp();
    }

    public void setLanguageType(LanguageType languageType) {
        this.languageType = languageType;
    }

    private Map<String, Object> extractArgs(Map<String, String> args, Function<String, Object> referenceExtractor) {
        return args.entrySet().stream()
                .map(entry -> {
                    try {
                        Object value = referenceExtractor.apply(entry.getValue());

                        return Map.entry(entry.getKey(), value);
                    } catch (Exception e) {
                        throw new ScriptExecutionException("Reference extracting error: " + e.getMessage(), e);
                    }
                })
                .collect(Collectors.toMap(Map.Entry::getKey, Map.Entry::getValue));
    }

    private ScriptRequest buildScriptRequest(String script, Map<String, Object> args) {
        return ScriptRequest.newBuilder()
                .setUuid(UUID.randomUUID().toString())
                .setLanguage(languageType.getCode())
//                .setEngine()
                .setScript(script)
                .setArgs(StructConverter.toStruct(args))
                .build();
    }
}
