package com.becon.opencelium.backend.resource.update_assistant.migrate.neo4j;

public class ConnectionNode {

    private Long id;
    private Long connectionId;
    private String name;
    private ConnectorNode fromConnector;
    private ConnectorNode toConnector;

    public Long getId() {
        return id;
    }

    public void setId(Long id) {
        this.id = id;
    }

    public Long getConnectionId() {
        return connectionId;
    }

    public void setConnectionId(Long connectionId) {
        this.connectionId = connectionId;
    }

    public String getName() {
        return name;
    }

    public void setName(String name) {
        this.name = name;
    }

    public ConnectorNode getFromConnector() {
        return fromConnector;
    }

    public void setFromConnector(ConnectorNode fromConnector) {
        this.fromConnector = fromConnector;
    }

    public ConnectorNode getToConnector() {
        return toConnector;
    }

    public void setToConnector(ConnectorNode toConnector) {
        this.toConnector = toConnector;
    }
}
