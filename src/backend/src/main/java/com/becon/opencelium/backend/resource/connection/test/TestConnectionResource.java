package com.becon.opencelium.backend.resource.connection.test;

import java.util.List;

public class TestConnectionResource {
    private Long connectionId;
    private String fromConnector;
    private String toConnector;
    private List<EntryResource> entries;

    public Long getConnectionId() {
        return connectionId;
    }

    public void setConnectionId(Long connectionId) {
        this.connectionId = connectionId;
    }

    public String getFromConnector() {
        return fromConnector;
    }

    public void setFromConnector(String fromConnector) {
        this.fromConnector = fromConnector;
    }

    public String getToConnector() {
        return toConnector;
    }

    public void setToConnector(String toConnector) {
        this.toConnector = toConnector;
    }

    public List<EntryResource> getEntries() {
        return entries;
    }

    public void setEntries(List<EntryResource> entries) {
        this.entries = entries;
    }
}
