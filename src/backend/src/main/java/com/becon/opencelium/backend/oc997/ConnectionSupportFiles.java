package com.becon.opencelium.backend.oc997;

import jakarta.annotation.Resource;

import java.util.ArrayList;
import java.util.List;

@Resource
public class ConnectionSupportFiles {
    private Long connectionId;
    private List<String> supportFiles = new ArrayList<>();

    public ConnectionSupportFiles() {
    }

    public ConnectionSupportFiles(Long connectionId, List<String> supportFiles) {
        this.connectionId = connectionId;
        this.supportFiles = supportFiles;
    }

    public Long getConnectionId() {
        return connectionId;
    }

    public void setConnectionId(Long connectionId) {
        this.connectionId = connectionId;
    }

    public List<String> getSupportFiles() {
        return supportFiles;
    }

    public void setSupportFiles(List<String> supportFiles) {
        this.supportFiles = supportFiles;
    }
}
