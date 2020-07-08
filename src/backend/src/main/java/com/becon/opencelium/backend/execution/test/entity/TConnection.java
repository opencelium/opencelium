package com.becon.opencelium.backend.execution.test.entity;

public class TConnection {
    private TConnector fromConnector;
    private TConnector toConnector;

    public TConnector getFromConnector() {
        return fromConnector;
    }

    public void setFromConnector(TConnector fromConnector) {
        this.fromConnector = fromConnector;
    }

    public TConnector getToConnector() {
        return toConnector;
    }

    public void setToConnector(TConnector toConnector) {
        this.toConnector = toConnector;
    }
}
