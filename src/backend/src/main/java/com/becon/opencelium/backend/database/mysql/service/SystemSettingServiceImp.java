package com.becon.opencelium.backend.database.mysql.service;

import com.becon.opencelium.backend.constant.PathConstant;
import com.becon.opencelium.backend.database.mysql.entity.SystemSetting;
import com.becon.opencelium.backend.database.mysql.repository.SystemSettingRepository;
import com.becon.opencelium.backend.exception.GeneralServiceException;
import com.becon.opencelium.backend.storage.StorageService;
import com.becon.opencelium.backend.utility.FileNameUtils;
import com.fasterxml.jackson.core.JsonProcessingException;
import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.fasterxml.jackson.databind.node.ObjectNode;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.multipart.MultipartFile;

import java.util.Optional;
import java.util.UUID;

@Service
public class SystemSettingServiceImp implements SystemSettingService {

    private static final int NAME_MAX_LENGTH = 100;
    private static final int VALUE_MAX_LENGTH = 1024;

    private final SystemSettingRepository repository;
    private final ObjectMapper objectMapper;
    private final StorageService storageService;

    public SystemSettingServiceImp(SystemSettingRepository repository, ObjectMapper objectMapper,
            StorageService storageService) {
        this.repository = repository;
        this.objectMapper = objectMapper;
        this.storageService = storageService;
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
        if (APP_LOGO.equals(name)) {
            throw new GeneralServiceException(HttpStatus.BAD_REQUEST, "RESERVED_SYSTEM_SETTING",
                    "Setting '" + APP_LOGO + "' references a stored file and is managed via"
                            + " POST/DELETE /system-setting/" + APP_LOGO);
        }
        return doSave(name, value);
    }

    @Override
    public void delete(String name) {
        if (name == null || name.isBlank()) {
            return;
        }
        repository.findById(name).ifPresent(repository::delete);
    }

    @Override
    @Transactional
    public SystemSetting saveIcon(MultipartFile file) {
        if (file == null || file.isEmpty()) {
            throw new GeneralServiceException(HttpStatus.BAD_REQUEST, "INVALID_SYSTEM_SETTING_ICON",
                    "Icon file is missing or empty");
        }
        String extension = FileNameUtils.getExtension(file.getOriginalFilename());
        if (!FileNameUtils.isSupportedImageExtension(extension)) {
            throw new GeneralServiceException(HttpStatus.BAD_REQUEST, "INVALID_SYSTEM_SETTING_ICON",
                    "Icon file should be jpg, jpeg or png");
        }

        String newFilename = UUID.randomUUID() + "." + extension.toLowerCase();
        String oldFilename = repository.findById(APP_LOGO)
                .map(this::extractFilename)
                .orElse(null);

        storageService.store(file, newFilename);

        ObjectNode value = objectMapper.createObjectNode();
        value.put("filename", newFilename);
        value.put("url", PathConstant.IMAGES + newFilename);
        SystemSetting saved = doSave(APP_LOGO, value);

        // Removed last: a failure here rolls back the row to the still-existing old file, so
        // every failure mode degrades to an orphaned file, never a dangling reference.
        if (oldFilename != null) {
            storageService.delete(oldFilename);
        }
        return saved;
    }

    @Override
    @Transactional
    public void deleteIcon() {
        Optional<SystemSetting> setting = repository.findById(APP_LOGO);
        if (setting.isEmpty()) {
            return;
        }
        String filename = extractFilename(setting.get());
        repository.delete(setting.get());
        if (filename != null) {
            storageService.delete(filename);
        }
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

    private SystemSetting doSave(String name, JsonNode value) {
        validateName(name);
        String serialized = serialize(name, value);

        SystemSetting setting = repository.findById(name).orElseGet(SystemSetting::new);
        setting.setName(name);
        setting.setValue(serialized);
        return repository.save(setting);
    }

    // Lenient on purpose: a corrupt or hand-edited row must not block re-upload or removal of the
    // icon — the worst outcome is one orphaned file in the storage directory.
    private String extractFilename(SystemSetting setting) {
        try {
            JsonNode filename = objectMapper.readTree(setting.getValue()).path("filename");
            return filename.isTextual() && !filename.asText().isBlank() ? filename.asText() : null;
        } catch (JsonProcessingException | IllegalArgumentException e) {
            return null;
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
