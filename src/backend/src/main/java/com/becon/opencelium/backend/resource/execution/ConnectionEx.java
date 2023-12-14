package com.becon.opencelium.backend.resource.execution;

import java.util.List;

public class ConnectionEx {
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
}
