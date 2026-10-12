package com.becon.opencelium.backend.database.mysql.service;

import com.becon.opencelium.backend.database.mysql.entity.SystemSetting;
import com.fasterxml.jackson.databind.JsonNode;
import org.springframework.web.multipart.MultipartFile;

import java.util.Optional;

public interface SystemSettingService {

    /** The system icon setting; its row references a stored file, so it is managed only through
     * {@link #saveIcon} / {@link #deleteIcon} and rejected by the generic {@link #save}. */
    String APP_LOGO = "app_logo";

    Optional<SystemSetting> find(String name);

    SystemSetting save(String name, JsonNode value);

    void delete(String name);

    SystemSetting saveIcon(MultipartFile file);

    void deleteIcon();

    /** Parses the stored text back into the JSON value the API exposes. */
    JsonNode toJson(SystemSetting setting);
}
