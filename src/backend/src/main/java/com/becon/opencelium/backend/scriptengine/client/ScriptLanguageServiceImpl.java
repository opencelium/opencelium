package com.becon.opencelium.backend.scriptengine.client;

import com.becon.opencelium.backend.scriptengine.Language;
import com.becon.opencelium.backend.scriptengine.LanguageType;
import com.becon.opencelium.backend.scriptengine.ScriptEngineType;
import com.becon.opencelium.backend.scriptengine.ScriptExecutionManager;
import com.becon.opencelium.backend.resource.languages.ScriptLanguageDTO;
import org.springframework.stereotype.Component;

import java.util.Collections;
import java.util.List;

@Component
public class ScriptLanguageServiceImpl implements ScriptLanguageService {

    private final ScriptExecutionManager scriptExecutionManager;

    public ScriptLanguageServiceImpl(ScriptExecutionManager scriptExecutionManager) {
        this.scriptExecutionManager = scriptExecutionManager;
    }

    @Override
    public List<ScriptLanguageDTO> getAllLanguages() {
        List<Language> languages = scriptExecutionManager.availableLanguages();

        if (languages == null || languages.isEmpty()) {
            return Collections.emptyList();
        }

        return languages.stream()
                .map(this::buildLanguage)
                .toList();
    }

    private ScriptLanguageDTO buildLanguage(Language language) {
        ScriptLanguageDTO languageDTO = new ScriptLanguageDTO();

        LanguageType langType = language.getLanguage();
        if (langType != null) {
            languageDTO.setLanguage(langType.getCode());
            languageDTO.setLanguageName(langType.getName());
        }

        ScriptEngineType engine = language.getEngine();
        if (engine != null) {
            languageDTO.setEngine(engine.getCode());
            languageDTO.setEngineName(engine.getName());
        }

        return languageDTO;
    }
}
