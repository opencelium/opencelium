package com.becon.opencelium.backend.database.mysql.service;

import com.becon.opencelium.backend.database.mysql.entity.SystemSetting;
import com.becon.opencelium.backend.database.mysql.repository.SystemSettingRepository;
import com.becon.opencelium.backend.exception.GeneralServiceException;
import com.fasterxml.jackson.core.JsonProcessingException;
import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;

import java.util.Optional;

@Service
public class SystemSettingServiceImp implements SystemSettingService {

    private static final int NAME_MAX_LENGTH = 100;
    private static final int VALUE_MAX_LENGTH = 1024;

    private final SystemSettingRepository repository;
    private final ObjectMapper objectMapper;

    public SystemSettingServiceImp(SystemSettingRepository repository, ObjectMapper objectMapper) {
        this.repository = repository;
        this.objectMapper = objectMapper;
    }

    @Override
    public Optional<SystemSetting> find(String name) {
        if (name == null || name.isBlank()) {
            return Optional.empty();
        }
        return repository.findById(name);
    }

    @Override
    public SystemSetting save(String name, JsonNode value) {
        validateName(name);
        String serialized = serialize(name, value);

        SystemSetting setting = repository.findById(name).orElseGet(SystemSetting::new);
        setting.setName(name);
        setting.setValue(serialized);
        return repository.save(setting);
    }

    @Override
    public void delete(String name) {
        if (name == null || name.isBlank()) {
            return;
        }
        repository.findById(name).ifPresent(repository::delete);
    }

    @Override
    public JsonNode toJson(SystemSetting setting) {
        try {
            return objectMapper.readTree(setting.getValue());
        } catch (JsonProcessingException | IllegalArgumentException e) {
            // Writes only ever store serialized JsonNodes, so this means the row was tampered
            // with outside the API. Surface it as a server error rather than a client mistake.
            throw new GeneralServiceException(HttpStatus.INTERNAL_SERVER_ERROR,
                    "CORRUPT_SYSTEM_SETTING_VALUE",
                    "Stored value of setting '" + setting.getName() + "' is not valid JSON");
        }
    }

    private void validateName(String name) {
        if (name == null || name.isBlank() || name.length() > NAME_MAX_LENGTH) {
            throw new GeneralServiceException(HttpStatus.BAD_REQUEST, "INVALID_SYSTEM_SETTING_NAME",
                    "Setting name must be a non-blank string of at most " + NAME_MAX_LENGTH
                            + " characters");
        }
    }

    // The value's shape belongs to the consumer, so only two guards apply: it must carry actual
    // content (Jackson maps an explicit JSON null to NullNode, which @NotNull cannot catch) and
    // its serialized form must fit the column budget.
    private String serialize(String name, JsonNode value) {
        if (value == null || value.isNull() || value.isMissingNode()) {
            throw new GeneralServiceException(HttpStatus.BAD_REQUEST, "INVALID_SYSTEM_SETTING_VALUE",
                    "Value of setting '" + name + "' must be a JSON value, not null");
        }
        String serialized;
        try {
            serialized = objectMapper.writeValueAsString(value);
        } catch (JsonProcessingException e) {
            throw new GeneralServiceException(HttpStatus.BAD_REQUEST, "INVALID_SYSTEM_SETTING_VALUE",
                    "Value of setting '" + name + "' could not be serialized to JSON");
        }
        if (serialized.length() > VALUE_MAX_LENGTH) {
            throw new GeneralServiceException(HttpStatus.BAD_REQUEST, "INVALID_SYSTEM_SETTING_VALUE",
                    "Value of setting '" + name + "' exceeds " + VALUE_MAX_LENGTH
                            + " characters when serialized");
        }
        return serialized;
    }
}
