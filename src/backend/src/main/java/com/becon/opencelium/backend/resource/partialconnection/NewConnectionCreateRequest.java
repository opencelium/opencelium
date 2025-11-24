package com.becon.opencelium.backend.resource.partialconnection;

import jakarta.validation.constraints.NotBlank;

public class NewConnectionCreateRequest {

    @NotBlank(message = "'title' field must be not blank")
    private String title;

    private String description;

    private Integer categoryId;

    public String getTitle() {
        return title;
    }

    public void setTitle(String title) {
        this.title = title;
    }

    public String getDescription() {
        return description;
    }

    public void setDescription(String description) {
        this.description = description;
    }

    public Integer getCategoryId() {
        return categoryId;
    }

    public void setCategoryId(Integer categoryId) {
        this.categoryId = categoryId;
    }
}
