package com.becon.opencelium.backend.polygot_engine;

import com.becon.opencelium.backend.polygot_engine.ex.InvalidScriptException;
import com.becon.opencelium.backend.polygot_engine.ex.ScriptExecutionException;

import java.util.Map;

public interface ScriptEngine {
    boolean supports(Language lang);

    Result execute(String script) throws ScriptExecutionException, InvalidScriptException;

    Result execute(String script, Map<String, Object> bindings) throws ScriptExecutionException, InvalidScriptException;

    void validate(String script) throws InvalidScriptException;

    boolean isUp();
}