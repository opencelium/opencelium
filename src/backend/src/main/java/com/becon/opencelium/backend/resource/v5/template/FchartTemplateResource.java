package com.becon.opencelium.backend.resource.v5.template;

import com.becon.opencelium.backend.resource.template.InvokerTemplateResource;

public class FchartTemplateResource {
    private String id;
    private Integer connectorId;
    private String flowId;
    private String title;
    private InvokerTemplateResource invoker;
    private Object methods;
    private Object operators;

    public String getId() {
        return id;
    }

    public void setId(String id) {
        this.id = id;
    }

    public Integer getConnectorId() {
        return connectorId;
    }

    public void setConnectorId(Integer connectorId) {
        this.connectorId = connectorId;
    }

    public String getFlowId() {
        return flowId;
    }

    public void setFlowId(String flowId) {
        this.flowId = flowId;
    }

    public String getTitle() {
        return title;
    }

    public void setTitle(String title) {
        this.title = title;
    }

    public InvokerTemplateResource getInvoker() {
        return invoker;
    }

    public void setInvoker(InvokerTemplateResource invoker) {
        this.invoker = invoker;
    }

    public Object getMethods() {
        return methods;
    }

    public void setMethods(Object methods) {
        this.methods = methods;
    }

    public Object getOperators() {
        return operators;
    }

    public void setOperators(Object operators) {
        this.operators = operators;
    }
}
