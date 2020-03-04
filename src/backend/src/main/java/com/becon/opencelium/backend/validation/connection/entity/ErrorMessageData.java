package com.becon.opencelium.backend.validation.connection.entity;

public class ErrorMessageData {

    private String index;
    private String location;
    private int connectorId;

    public ErrorMessageData() {
    }

    public ErrorMessageData(String index, String location, int connectorId) {
        this.index = index;
        this.location = location;
        this.connectorId = connectorId;
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
