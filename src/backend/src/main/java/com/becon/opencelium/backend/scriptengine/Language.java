package com.becon.opencelium.backend.scriptengine;

import java.util.Objects;

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

    @Override
    public boolean equals(Object o) {
        if (this == o) return true;
        if (o == null || getClass() != o.getClass()) return false;
        Language language1 = (Language) o;
        return language == language1.language &&
                engine == language1.engine;
    }

    @Override
    public int hashCode() {
        return Objects.hash(language, engine);
    }
}