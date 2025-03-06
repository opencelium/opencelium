package com.becon.opencelium.backend.execution.support_file;

import com.becon.opencelium.backend.enums.SupportFileStatus;
import jakarta.annotation.Resource;

@Resource
public class SupportFile {
    private Long connectionId;
    private String connectionTitle;
    private String supportFile;
    private SupportFileStatus status;
    private String message;

    public SupportFile() {
    }

    public SupportFile(Long connectionId, String connectionTitle, String supportFile, SupportFileStatus status, String message) {
        this.connectionId = connectionId;
        this.connectionTitle = connectionTitle;
        this.supportFile = supportFile;
        this.status = status;
        this.message = message;
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

    public String getSupportFile() {
        return supportFile;
    }

    public void setSupportFile(String supportFile) {
        this.supportFile = supportFile;
    }

    public SupportFileStatus getStatus() {
        return status;
    }

    public void setStatus(SupportFileStatus status) {
        this.status = status;
    }

    public String getMessage() {
        return message;
    }

    public void setMessage(String message) {
        this.message = message;
    }
}
