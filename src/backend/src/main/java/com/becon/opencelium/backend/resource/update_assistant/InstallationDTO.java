package com.becon.opencelium.backend.resource.update_assistant;

public class InstallationDTO {
    private String type;

    public InstallationDTO() {
    }

    public InstallationDTO(String type) {
        this.type = type;
    }

    public String getType() {
        return type;
    }

    public void setType(String type) {
        this.type = type;
    }
}
