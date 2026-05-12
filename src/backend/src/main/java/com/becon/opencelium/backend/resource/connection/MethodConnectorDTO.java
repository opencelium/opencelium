package com.becon.opencelium.backend.resource.connection;

import jakarta.annotation.Resource;

@Resource
public class MethodConnectorDTO {

    private Integer connectorId;
    private String title;

    public Integer getConnectorId() {
        return connectorId;
    }

    public void setConnectorId(Integer connectorId) {
        this.connectorId = connectorId;
    }

    public String getTitle() {
        return title;
    }

    public void setTitle(String title) {
        this.title = title;
    }
}
