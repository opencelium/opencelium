package com.becon.opencelium.backend.resource;

import com.fasterxml.jackson.annotation.JsonInclude;

@JsonInclude(JsonInclude.Include.NON_NULL)
public class FileDTO {

    private String id;
    private String path;

    public FileDTO() {
    }

    public FileDTO(String id, String path) {
        this.id = id;
        this.path = path;
    }

    public String getId() {
        return id;
    }

    public void setId(String id) {
        this.id = id;
    }

    public String getPath() {
        return path;
    }

    public void setPath(String path) {
        this.path = path;
    }
}
