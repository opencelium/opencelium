package com.becon.opencelium.backend.resource.execution;

import java.util.Map;

public class ExecutionObj {
    private Map<String, String> queryParams;
    private ConnectionEx connection;
    private ProxyEx proxy;

    public ExecutionObj() {
    }

    public Map<String, String> getQueryParams() {
        return queryParams;
    }

    public void setQueryParams(Map<String, String> queryParams) {
        this.queryParams = queryParams;
    }

    public ProxyEx getProxy() {
        return proxy;
    }

    public void setProxy(ProxyEx proxy) {
        this.proxy = proxy;
    }

    public ConnectionEx getConnection() {
        return connection;
    }

    public void setConnection(ConnectionEx connection) {
        this.connection = connection;
    }
}
