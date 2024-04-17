package com.becon.opencelium.backend.execution.oc721;

import com.becon.opencelium.backend.resource.execution.ConnectorEx;

import java.util.Map;

public class Connector {
    private Integer id;
    private String name;
    private String invoker;
    private boolean sslCert;
    private int timeout;
    private boolean isActive;
    private Map<String, String> requiredData;

    public Integer getId() {
        return id;
    }

    public static Connector fromEx(ConnectorEx connectorEx) {
        Connector result = new Connector();
        result.setId(connectorEx.getId());
        result.setName(connectorEx.getName());
        result.setInvoker(connectorEx.getInvoker());
        result.setSslCert(connectorEx.isSslCert());
        result.setTimeout(connectorEx.getTimeout());
        result.setActive(connectorEx.isAction());
        result.setRequiredData(connectorEx.getRequiredData());

        return result;
    }

    public void setId(Integer id) {
        this.id = id;
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

    public Map<String, String> getRequiredData() {
        return requiredData;
    }

    public void setRequiredData(Map<String, String> requiredData) {
        this.requiredData = requiredData;
    }
}
