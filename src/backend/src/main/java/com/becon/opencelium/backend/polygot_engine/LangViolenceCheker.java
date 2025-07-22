package com.becon.opencelium.backend.polygot_engine;

import com.becon.opencelium.backend.polygot_engine.ex.InvalidScriptException;

public interface LangViolenceCheker {
    void check(String script) throws InvalidScriptException;
}