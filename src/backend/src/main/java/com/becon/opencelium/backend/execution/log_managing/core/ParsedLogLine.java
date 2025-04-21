package com.becon.opencelium.backend.execution.log_managing.core;

import com.becon.opencelium.backend.execution.log_managing.commons.LogEntryType;

import java.util.Map;

public class ParsedLogLine {
    private LogEntryType entryType;
    private String indexPath;
    private Map<String, Object> properties;
    private long size;

    //---- GETTER and SETTERS ----//

    public LogEntryType getEntryType() {
        return entryType;
    }

    public void setEntryType(LogEntryType entryType) {
        this.entryType = entryType;
    }

    public String getIndexPath() {
        return indexPath;
    }

    public void setIndexPath(String indexPath) {
        this.indexPath = indexPath;
    }

    public Map<String, Object> getProperties() {
        return properties;
    }

    public void setProperties(Map<String, Object> properties) {
        this.properties = properties;
    }

    public long getSize() {
        return size;
    }

    public void setSize(long size) {
        this.size = size;
    }
}