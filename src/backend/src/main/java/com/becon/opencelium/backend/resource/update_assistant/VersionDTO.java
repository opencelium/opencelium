package com.becon.opencelium.backend.resource.update_assistant;

public class VersionDTO {

    private String version;

    public VersionDTO() {
    }

    public VersionDTO(String version) {
        this.version = version;
    }

    public String getVersion() {
        return version;
    }

    public void setVersion(String version) {
        this.version = version;
    }
}
