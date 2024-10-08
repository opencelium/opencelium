package com.becon.opencelium.backend.database.mysql.repository;

import com.becon.opencelium.backend.database.mysql.entity.EditorSettings;
import com.becon.opencelium.backend.database.mysql.entity.User;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.Optional;

public interface EditorSettingsRepository extends JpaRepository<EditorSettings, Integer> {
    Optional<EditorSettings> findEditorSettingsByUser(User user);
}
