package com.becon.opencelium.backend.polygot_engine;

public abstract class LangViolenceChekerFactory {
    public static LangViolenceCheker get(LanguageType lang) {
        return script -> {
        };
    }
}