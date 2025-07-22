package com.becon.opencelium.backend.polygot_engine;

import com.becon.opencelium.backend.polygot_engine.ex.InvalidScriptException;

public interface ScriptValidator {
    void validate(String script) throws InvalidScriptException;
}