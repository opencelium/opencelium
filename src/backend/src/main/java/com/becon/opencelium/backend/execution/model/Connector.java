package com.becon.opencelium.backend.execution.model;

import com.becon.opencelium.backend.invoker.entity.Pagination;
import com.becon.opencelium.backend.resource.execution.ConnectorEx;

import java.util.Map;

public class Connector {
    private Integer id;
    private String fchartId;
    private String name;
    private String invoker;
    private boolean sslCert;
    private int timeout;
    private boolean isActive;
    private Pagination pagination;
    private Map<String, String> requiredData;

    public static Connector fromEx(ConnectorEx connectorEx) {
        Connector result = new Connector();
        result.setId(connectorEx.getId());
        result.setFchartId(connectorEx.getFchartId());
        result.setName(connectorEx.getName());
        result.setInvoker(connectorEx.getInvoker());
        result.setSslCert(connectorEx.isSslCert());
        result.setTimeout(connectorEx.getTimeout());
        result.setActive(connectorEx.isAction());
        result.setPagination(connectorEx.getPagination());
        result.setRequiredData(connectorEx.getRequiredData());

        return result;
    }

    public Integer getId() {
        return id;
    }

    public void setId(Integer id) {
        this.id = id;
    }

    public String getFchartId() {
        return fchartId;
    }

    public void setFchartId(String fchartId) {
        this.fchartId = fchartId;
    }

    public String getName() {
        return name;
    }

    public void setName(String name) {
        this.name = name;
    }

    public String getInvoker() {
        return invoker;
    }

    public void setInvoker(String invoker) {
        this.invoker = invoker;
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

    public boolean isActive() {
        return isActive;
    }

    public void setActive(boolean active) {
        isActive = active;
    }

    public Pagination getPagination() {
        return pagination;
    }

    public void setPagination(Pagination pagination) {
        this.pagination = pagination;
    }

    public Map<String, String> getRequiredData() {
        return requiredData;
    }

    public void setRequiredData(Map<String, String> requiredData) {
        this.requiredData = requiredData;
    }
}
