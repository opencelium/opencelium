package com.becon.opencelium.backend.application.entity;

public class AvailableUpdate {
    private String folder;
    private String version;
    private String changelogLink;
    private String status;
    private String instruction;

    public String getFolder() {
        return folder;
    }

    public void setFolder(String folder) {
        this.folder = folder;
    }

    public String getVersion() {
        return version;
    }

    public void setVersion(String version) {
        this.version = version;
    }

    public String getChangelogLink() {
        return changelogLink;
    }

    public void setChangelogLink(String changelogLink) {
        this.changelogLink = changelogLink;
    }

    public String getStatus() {
        return status;
    }

    public void setStatus(String status) {
        this.status = status;
    }

    public String getInstruction() {
        return instruction;
    }

    public void setInstruction(String instruction) {
        this.instruction = instruction;
    }
}
