package com.becon.opencelium.backend.resource;

import com.fasterxml.jackson.annotation.JsonInclude;

@JsonInclude(JsonInclude.Include.NON_NULL)
public class EditorSettingsDTO {
    private Integer id;
    private Integer userId;
    private String colorMode;
    private Integer processTextSize;

    public Integer getId() {
        return id;
    }

    public Integer getUserId() {
        return userId;
    }

    public String getColorMode() {
        return colorMode;
    }

    public Integer getProcessTextSize() {
        return processTextSize;
    }

    public void setId(Integer id) {
        this.id = id;
    }

    public void setUserId(Integer userId) {
        this.userId = userId;
    }

    public void setColorMode(String colorMode) {
        this.colorMode = colorMode;
    }

    public void setProcessTextSize(Integer processTextSize) {
        this.processTextSize = processTextSize;
    }
}
