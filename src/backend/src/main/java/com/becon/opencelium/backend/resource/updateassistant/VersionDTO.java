package com.becon.opencelium.backend.resource.updateassistant;

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
