package com.becon.opencelium.backend.resource.connection.v5;

import com.becon.opencelium.backend.resource.connection.MethodDTO;
import com.becon.opencelium.backend.resource.connection.OperatorDTO;
import com.becon.opencelium.backend.resource.connector.InvokerDTO;

import java.util.List;

public class FlowchartDTO {

    private String flowId;
    private Integer connectorId;
    private String title;
    private String icon;
    private Boolean sslCert;
    private Integer timeout;
    private InvokerDTO invoker;
    private List<MethodDTO> methods;
    private List<OperatorDTO> operators;

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

    public String getIcon() {
        return icon;
    }

    public void setIcon(String icon) {
        this.icon = icon;
    }

    public Boolean isSslCert() {
        return sslCert;
    }

    public void setSslCert(Boolean sslCert) {
        this.sslCert = sslCert;
    }

    public Integer getTimeout() {
        return timeout;
    }

    public void setTimeout(Integer timeout) {
        this.timeout = timeout;
    }

    public InvokerDTO getInvoker() {
        return invoker;
    }

    public void setInvoker(InvokerDTO invoker) {
        this.invoker = invoker;
    }

    public List<MethodDTO> getMethods() {
        return methods;
    }

    public void setMethods(List<MethodDTO> methods) {
        this.methods = methods;
    }

    public List<OperatorDTO> getOperators() {
        return operators;
    }

    public void setOperators(List<OperatorDTO> operators) {
        this.operators = operators;
    }

    public String getFlowId() {
        return flowId;
    }

    public void setFlowId(String flowId) {
        this.flowId = flowId;
    }
}
