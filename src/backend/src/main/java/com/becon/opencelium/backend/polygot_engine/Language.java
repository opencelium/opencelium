package com.becon.opencelium.backend.polygot_engine;

public class Language {
    private final LanguageType language;
    private final ScriptEngineType engine;

    public Language(LanguageType language, ScriptEngineType engine) {
        this.language = language;
        this.engine = engine;
    }

    public LanguageType getLanguage() {
        return language;
    }

    public ScriptEngineType getEngine() {
        return engine;
    }
}