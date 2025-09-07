package com.becon.opencelium.backend.polygot_engine;

import static com.becon.opencelium.backend.polygot_engine.ScriptEngineType.*;

public enum LanguageType {
    JS("js", "JavaScript", NASHORN),
    PYTHON_2("python2", "Python 2", JYTHON),
    PYTHON_3("python3", "Python 3", GRAALVM),
    ;

    private final String code;
    private final String name;
    private final ScriptEngineType defaultEngine;

    LanguageType(String code, String name, ScriptEngineType defaultEngine) {
        this.code = code;
        this.name = name;
        this.defaultEngine = defaultEngine;
    }

    public String getCode() {
        return code;
    }

    public String getName() {
        return name;
    }

    public ScriptEngineType getDefaultEngine() {
        return defaultEngine;
    }
}
