package com.becon.opencelium.backend.database.mysql.service;

import com.becon.opencelium.backend.database.mysql.entity.EditorSettings;
import com.becon.opencelium.backend.database.mysql.entity.User;
import com.becon.opencelium.backend.database.mysql.repository.EditorSettingsRepository;
import com.becon.opencelium.backend.resource.EditorSettingsDTO;
import org.springframework.beans.factory.annotation.Qualifier;
import org.springframework.stereotype.Service;

@Service
public class EditorSettingsServiceImp implements EditorSettingsService {
    private final UserService userService;
    private final EditorSettingsRepository repository;

    public EditorSettingsServiceImp(@Qualifier("userServiceImpl") UserService userService, EditorSettingsRepository repository) {
        this.userService = userService;
        this.repository = repository;
    }

    @Override
    public EditorSettings save(EditorSettingsDTO settingsDto) {
        if (settingsDto == null) {
            throw new IllegalArgumentException("settings is null");
        }

        Integer userId = settingsDto.getUserId();
        if (userId == null || !userService.existsById(userId)) {
            throw new IllegalArgumentException("user not found with given userId");
        }

        User user = userService.getById(userId);
        EditorSettings settings = repository
                .findEditorSettingsByUser(user)
                .orElse(new EditorSettings());

        settings.setUser(user);
        settings.setColorMode(settingsDto.getColorMode());
        settings.setProcessTextSize(settingsDto.getProcessTextSize());

        repository.save(settings);
        return settings;
    }

    @Override
    public EditorSettings getByUserId(Integer userId) {
        if (userId == null || !userService.existsById(userId)) {
            throw new IllegalArgumentException("user not found with given userId");
        }
        User user = new User();
        user.setId(userId);
        return repository.findEditorSettingsByUser(user)
                .orElseThrow(() -> new IllegalArgumentException("settings not found with given userId"));
    }
}
