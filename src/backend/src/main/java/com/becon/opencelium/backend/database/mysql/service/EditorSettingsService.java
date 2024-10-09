package com.becon.opencelium.backend.database.mysql.service;

import com.becon.opencelium.backend.database.mysql.entity.EditorSettings;
import com.becon.opencelium.backend.resource.EditorSettingsDTO;

public interface EditorSettingsService {
    EditorSettings save(EditorSettingsDTO settingsDto);
    EditorSettings getByUserId(Integer userId);
}
