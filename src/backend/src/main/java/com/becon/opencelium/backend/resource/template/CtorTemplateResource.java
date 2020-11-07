package com.becon.opencelium.backend.resource.template;

import com.fasterxml.jackson.annotation.JsonIgnoreProperties;

@JsonIgnoreProperties(ignoreUnknown = true)
public class CtorTemplateResource {

    private Long nodeId;
    private Integer connectorId;
    private String title;
    private InvokerTemplateResource invoker; // due to front end asked sending object, normally should be name of invoker
    private Object methods;
    private Object operators;

    public Long getNodeId() {
        return nodeId;
    }

    public void setNodeId(Long nodeId) {
        this.nodeId = nodeId;
    }

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
