package com.becon.opencelium.backend.scriptengine;

import java.util.List;

public enum ScriptEngineType {
    NASHORN("nashorn", "Nashorn"),
    POLYGOT_ENGINE("polygot-engine", "Polygot Engine");

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
            case POLYGOT_ENGINE ->
                    List.of(LanguageType.JS, LanguageType.PYTHON_2, LanguageType.PYTHON_3, LanguageType.RUBY);
        };
    }
}
