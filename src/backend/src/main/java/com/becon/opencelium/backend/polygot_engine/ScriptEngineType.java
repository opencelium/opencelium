package com.becon.opencelium.backend.polygot_engine;

import java.util.List;

public enum ScriptEngineType {
    NASHORN("nashorn", "Nashorn"),
    JYTHON("jython", "Jython");

    private final String code;
    private final String name;

    ScriptEngineType(String code, String name) {
        this.code = code;
        this.name = name;
    }

    public String getCode() {
        return code;
    }

    public String getName() {
        return name;
    }

    public List<LanguageType> getLanguages() {
        return switch (this) {
            case NASHORN -> List.of(LanguageType.JS);
            case JYTHON -> List.of(LanguageType.PYTHON_2);
        };
    }
}
