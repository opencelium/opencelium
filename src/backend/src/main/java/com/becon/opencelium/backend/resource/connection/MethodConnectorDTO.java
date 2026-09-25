package com.becon.opencelium.backend.resource.connection;

import com.fasterxml.jackson.annotation.JsonAlias;
import jakarta.annotation.Resource;

@Resource
public class MethodConnectorDTO {

    private Integer connectorId;
    private String title;
    @JsonAlias("invokerName")
    private String invoker;

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

    public String getInvoker() {
        return invoker;
    }

    public void setInvoker(String invoker) {
        this.invoker = invoker;
    }
}
