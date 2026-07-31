package com.becon.opencelium.backend.database.mongodb.entity;

import org.springframework.data.mongodb.core.mapping.Field;

/**
 * Embedded connector reference stored on a method in multi-connector connections.
 * <p>
 * In legacy (two-connector) connections each method belongs to either
 * {@code fromConnector} or {@code toConnector} on {@link ConnectionMng}, and the
 * connector identity is implicit from that grouping. In multi-connector connections
 * every method carries this object
 * <p>
 * Stored as the {@code connector} sub-document inside a {@code method} document.
 */
public class MethodConnectorMng {

    /**
     * Primary key of the connector in the relational database.
     * Used at execution time to load connector (invoker, title, timeout, etc.).
     */
    @Field(name = "connector_id")
    private Integer connectorId;

    /**
     * Denormalized display name of the connector.
     * Stored here so the connection graph can be rendered without an extra DB lookup.
     */
    @Field(name = "title")
    private String title;

    private String invoker;

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

    public String getInvoker() {
        return invoker;
    }

    public void setInvoker(String invoker) {
        this.invoker = invoker;
    }
}
