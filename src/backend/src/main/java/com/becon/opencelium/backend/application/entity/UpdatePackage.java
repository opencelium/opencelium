package com.becon.opencelium.backend.application.entity;

public class UpdatePackage {
    private String name;
    private String version;
    private String changelogLink;
    private String status;

    public String getName() {
        return name;
    }

    public void setName(String name) {
        this.name = name;
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
}
