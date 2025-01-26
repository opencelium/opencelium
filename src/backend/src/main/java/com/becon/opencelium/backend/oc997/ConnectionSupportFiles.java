package com.becon.opencelium.backend.oc997;

import jakarta.annotation.Resource;

import java.util.ArrayList;
import java.util.List;

@Resource
public class ConnectionSupportFiles {
    private Long connectionId;
    private String connectionTitle;
    private List<String> supportFiles = new ArrayList<>();

    public ConnectionSupportFiles() {
    }

    public ConnectionSupportFiles(Long connectionId) {
        this.connectionId = connectionId;
    }

    public ConnectionSupportFiles(Long connectionId, String connectionTitle, List<String> fileUrls) {
        this.connectionId = connectionId;
        this.connectionTitle = connectionTitle;
        this.supportFiles = fileUrls;
    }

    public Long getConnectionId() {
        return connectionId;
    }

    public void setConnectionId(Long connectionId) {
        this.connectionId = connectionId;
    }

    public String getConnectionTitle() {
        return connectionTitle;
    }

    public void setConnectionTitle(String connectionTitle) {
        this.connectionTitle = connectionTitle;
    }

    public List<String> getSupportFiles() {
        return supportFiles;
    }

    public void setSupportFiles(List<String> supportFiles) {
        this.supportFiles = supportFiles;
    }
}
