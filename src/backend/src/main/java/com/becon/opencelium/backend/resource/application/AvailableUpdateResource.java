package com.becon.opencelium.backend.resource.application;

import com.fasterxml.jackson.annotation.JsonInclude;

import javax.annotation.Resource;

@Resource
@JsonInclude(JsonInclude.Include.NON_NULL)
public class AvailableUpdateResource {
    private String folder;
    private String version;
    private String changelogLink;
    private String status;

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
}
