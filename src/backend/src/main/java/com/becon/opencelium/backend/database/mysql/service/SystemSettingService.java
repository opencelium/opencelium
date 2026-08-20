package com.becon.opencelium.backend.database.mysql.service;

import com.becon.opencelium.backend.database.mysql.entity.SystemSetting;
import com.fasterxml.jackson.databind.JsonNode;

import java.util.Optional;

public interface SystemSettingService {

    Optional<SystemSetting> find(String name);

    SystemSetting save(String name, JsonNode value);

    void delete(String name);

    /** Parses the stored text back into the JSON value the API exposes. */
    JsonNode toJson(SystemSetting setting);
}
