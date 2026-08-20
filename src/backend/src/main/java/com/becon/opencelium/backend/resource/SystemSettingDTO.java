package com.becon.opencelium.backend.resource;

import com.becon.opencelium.backend.database.mysql.entity.SystemSetting;
import com.fasterxml.jackson.databind.JsonNode;
import jakarta.validation.constraints.NotNull;

import java.util.Date;

public class SystemSettingDTO {

    private String name;

    /**
     * The setting's content as a real JSON value (object, array, or scalar). The backend does not
     * interpret its shape — it is serialized verbatim into the {@code system_setting.value}
     * column, so consumers can evolve the structure without backend changes.
     */
    @NotNull
    private JsonNode value;

    private Date updatedAt;

    public SystemSettingDTO() {
    }

    public SystemSettingDTO(SystemSetting setting, JsonNode value) {
        this.name = setting.getName();
        this.value = value;
        this.updatedAt = setting.getUpdatedAt();
    }

    public String getName() {
        return name;
    }

    public void setName(String name) {
        this.name = name;
    }

    public JsonNode getValue() {
        return value;
    }

    public void setValue(JsonNode value) {
        this.value = value;
    }

    public Date getUpdatedAt() {
        return updatedAt;
    }

    public void setUpdatedAt(Date updatedAt) {
        this.updatedAt = updatedAt;
    }
}
