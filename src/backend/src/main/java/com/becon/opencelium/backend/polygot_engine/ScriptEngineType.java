package com.becon.opencelium.backend.polygot_engine;

import java.util.EnumMap;
import java.util.List;
import java.util.Map;

public enum ScriptEngineType {
    NASHORN("nashorn", "Nashorn");

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

    private static final Map<ScriptEngineType, List<LanguageType>> languageMap;

    static {
        languageMap = new EnumMap<>(ScriptEngineType.class);
        languageMap.put(NASHORN, List.of(LanguageType.JS));
    }

    public List<LanguageType> getLanguages() {
        return languageMap.getOrDefault(this, List.of());
    }
}
