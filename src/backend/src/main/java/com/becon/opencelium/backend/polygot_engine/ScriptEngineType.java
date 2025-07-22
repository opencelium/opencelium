package com.becon.opencelium.backend.polygot_engine;

import java.util.List;

import static com.becon.opencelium.backend.polygot_engine.LanguageType.*;

enum ScriptEngineType {
    NASHORN("nashorn", "Nashorn", List.of(JS));

    private final String code;
    private final String name;
    private final List<LanguageType> languages;

    ScriptEngineType(String code, String name, List<LanguageType> languages) {
        this.code = code;
        this.name = name;
        this.languages = languages;
    }

    public String getCode() {
        return code;
    }

    public String getName() {
        return name;
    }

    public List<LanguageType> getLanguages() {
        return languages;
    }
}