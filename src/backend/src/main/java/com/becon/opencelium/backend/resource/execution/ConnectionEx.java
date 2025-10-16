package com.becon.opencelium.backend.resource.execution;

import java.util.List;

public class ConnectionEx {
    private long connectionId;
    private String connectionName;
    private List<FlowchartEx> flowcharts;
    private ExecutionPlanEx executionPlan;
    private List<FieldBindEx> fieldBind;

    public ConnectionEx() {
    }

    public List<FlowchartEx> getFlowcharts() {
        return flowcharts;
    }

    public void setFlowcharts(List<FlowchartEx> flowcharts) {
        this.flowcharts = flowcharts;
    }

    public ExecutionPlanEx getExecutionPlan() {
        return executionPlan;
    }

    public void setExecutionPlan(ExecutionPlanEx executionPlan) {
        this.executionPlan = executionPlan;
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
