package com.becon.opencelium.backend.resource.execution;

import com.becon.opencelium.backend.invoker.entity.Pagination;

import java.util.List;
import java.util.Map;

public class FlowchartEx {
    private Integer ctorId;

    private String flowId;

    private String title;

    private String name;

    private boolean sslCert;

    private int timeout;

    private boolean action;

    private Pagination pagination;

    private InvokerEx invoker;

    private List<OperationDTO> methods;

    private List<OperatorEx> operators;

    private Map<String, String> requiredData;

    public Integer getCtorId() {
        return ctorId;
    }

    public void setCtorId(Integer ctorId) {
        this.ctorId = ctorId;
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

    public String getName() {
        return name;
    }

    public void setName(String name) {
        this.name = name;
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

    public boolean isAction() {
        return action;
    }

    public void setAction(boolean action) {
        this.action = action;
    }

    public Pagination getPagination() {
        return pagination;
    }

    public void setPagination(Pagination pagination) {
        this.pagination = pagination;
    }

    public InvokerEx getInvoker() {
        return invoker;
    }

    public void setInvoker(InvokerEx invoker) {
        this.invoker = invoker;
    }

    public List<OperationDTO> getMethods() {
        return methods;
    }

    public void setMethods(List<OperationDTO> methods) {
        this.methods = methods;
    }

    public List<OperatorEx> getOperators() {
        return operators;
    }

    public void setOperators(List<OperatorEx> operators) {
        this.operators = operators;
    }

    public Map<String, String> getRequiredData() {
        return requiredData;
    }

    public void setRequiredData(Map<String, String> requiredData) {
        this.requiredData = requiredData;
    }
}
