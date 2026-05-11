package com.becon.opencelium.backend.resource.execution;

import java.util.List;
import java.util.Map;

public class ConnectionEx {
    private long connectionId;
    private String connectionName;

    /**
     * Source connector with its methods and operators.
     * <p>
     * <b>Populated only for legacy (two-connector) connections.</b>
     */
    private ConnectorEx source;

    /**
     * Target connector with its methods and operators.
     * <p>
     * <b>Populated only for legacy (two-connector) connections.</b>
     * Null when {@link #connectors} is used (multi-connector mode).
     * Always check for null before accessing.
     */
    private ConnectorEx target;

    private List<FieldBindEx> fieldBind;

    /**
     * Connector metadata for multi-connector connections, keyed by connector ID.
     * <p>
     * Each entry holds the resolved connector config (title, invoker, timeout, etc.)
     * for a connector referenced by one or more methods. Methods look up their connector
     * here via {@link OperationDTO#getConnectorId()}.
     * <p>
     * <b>Populated only for multi-connector connections.</b>
     * Null for legacy connections — use {@link #source} and {@link #target} instead.
     */
    private Map<Integer, MethodConnectorEx> connectors;

    public ConnectionEx() {
    }

    public ConnectorEx getSource() {
        return source;
    }

    public void setSource(ConnectorEx source) {
        this.source = source;
    }

    public ConnectorEx getTarget() {
        return target;
    }

    public void setTarget(ConnectorEx target) {
        this.target = target;
    }

    public List<FieldBindEx> getFieldBind() {
        return fieldBind;
    }

    public void setFieldBind(List<FieldBindEx> fieldBind) {
        this.fieldBind = fieldBind;
    }

    public long getConnectionId() {
        return connectionId;
    }

    public void setConnectionId(long connectionId) {
        this.connectionId = connectionId;
    }

    public String getConnectionName() {
        return connectionName;
    }

    public void setConnectionName(String connectionName) {
        this.connectionName = connectionName;
    }

    public Map<Integer, MethodConnectorEx> getConnectors() {
        return connectors;
    }

    public void setConnectors(Map<Integer, MethodConnectorEx> connectors) {
        this.connectors = connectors;
    }
}
