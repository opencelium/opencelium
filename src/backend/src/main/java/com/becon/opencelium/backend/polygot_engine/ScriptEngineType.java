package com.becon.opencelium.backend.polygot_engine;

import java.util.List;

public enum ScriptEngineType {
    NASHORN("nashorn", "Nashorn"),
    JYTHON("jython", "Jython"),
    GRAALVM("graalvm", "GraalVM");

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
            case GRAALVM -> List.of(LanguageType.JS, LanguageType.PYTHON_3, LanguageType.RUBY);
        };
    }
}
