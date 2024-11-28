package com.becon.opencelium.backend.resource.execution;

import java.util.List;

public class ConnectionEx {
    private long connectionId;
    private String connectionName;
    private ConnectorEx source;
    private ConnectorEx target;
    private List<FieldBindEx> fieldBind;

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
}
