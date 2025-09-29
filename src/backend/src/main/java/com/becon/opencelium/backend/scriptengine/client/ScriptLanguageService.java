package com.becon.opencelium.backend.scriptengine.client;

import com.becon.opencelium.backend.resource.languages.ScriptLanguageDTO;

import java.util.List;

public interface ScriptLanguageService {
    List<ScriptLanguageDTO> getAllLanguages();
}
