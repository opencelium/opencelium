package com.becon.opencelium.backend.resource.connection.v5;

import com.becon.opencelium.backend.database.mysql.entity.BusinessLayout;
import com.becon.opencelium.backend.resource.connection.MethodDTO;
import com.becon.opencelium.backend.resource.connection.OperatorDTO;
import com.becon.opencelium.backend.resource.connector.InvokerDTO;

import java.util.List;

public class FlowchartDTO {

    private String flowId;
    private Integer connectorId;
    private String title;
    private String icon;
    private boolean sslCert;
    private int timeout;
    private InvokerDTO invoker;
    private BusinessLayout businessLayout;
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

    public boolean isSslCert() {
        return sslCert;
    }

    public void setSslCert(boolean sslCert) {
        this.sslCert = sslCert;
    }

    public int getTimeout() {
        return timeout;
    }

    public void setTimeout(int timeout) {
        this.timeout = timeout;
    }

    public InvokerDTO getInvoker() {
        return invoker;
    }

    public void setInvoker(InvokerDTO invoker) {
        this.invoker = invoker;
    }

    public BusinessLayout getBusinessLayout() {
        return businessLayout;
    }

    public void setBusinessLayout(BusinessLayout businessLayout) {
        this.businessLayout = businessLayout;
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
