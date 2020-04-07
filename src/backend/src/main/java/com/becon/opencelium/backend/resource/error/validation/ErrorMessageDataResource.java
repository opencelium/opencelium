package com.becon.opencelium.backend.resource.error.validation;

import com.becon.opencelium.backend.validation.connection.entity.ErrorMessageData;

import javax.annotation.Resource;

@Resource
public class ErrorMessageDataResource {

    private String index;
    private String location;
    private int connectorId;

    public ErrorMessageDataResource() {
    }

    public ErrorMessageDataResource(String index, String location, int connectorId) {
        this.index = index;
        this.location = location;
        this.connectorId = connectorId;
    }

    public ErrorMessageDataResource(ErrorMessageData data) {
        this.index = data.getIndex();
        this.location = data.getLocation();
        this.connectorId = data.getConnectorId();
    }

    public String getIndex() {
        return index;
    }

    public void setIndex(String index) {
        this.index = index;
    }

    public String getLocation() {
        return location;
    }

    public void setLocation(String location) {
        this.location = location;
    }

    public int getConnectorId() {
        return connectorId;
    }

    public void setConnectorId(int connectorId) {
        this.connectorId = connectorId;
    }
}
