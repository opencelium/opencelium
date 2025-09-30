package com.becon.opencelium.backend.scriptengine.config;

import com.becon.opencelium.backend.scriptengine.LanguageType;
import com.becon.opencelium.backend.scriptengine.ScriptEngineType;
import jakarta.validation.constraints.NotNull;
import org.springframework.boot.context.properties.ConfigurationProperties;
import org.springframework.context.annotation.Configuration;
import org.springframework.validation.annotation.Validated;

import java.util.List;

@Validated
@Configuration
@ConfigurationProperties(prefix = "opencelium")
public class ScriptLangProperties {

    private List<LanguageProperties> languages;

    public void setLanguages(List<LanguageProperties> languages) {
        this.languages = languages;
    }

    public List<LanguageProperties> getLanguages() {
        return languages;
    }

    public static class LanguageProperties {

        @NotNull(message = "Invalid language")
        private LanguageType lang;

        private ScriptEngineType engine;

        public LanguageType getLang() {
            return lang;
        }

        public void setLang(LanguageType lang) {
            this.lang = lang;
        }

        public ScriptEngineType getEngine() {
            return engine;
        }

        public void setEngine(ScriptEngineType engine) {
            this.engine = engine;
        }

        @Override
        public String toString() {
            return "{" +
                    "lang=" + lang +
                    ", engine=" + engine +
                    '}';
        }
    }

}
