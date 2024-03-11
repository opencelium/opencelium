package com.becon.opencelium.backend.resource.execution;

import java.util.Map;

public class ExecutionObj {
    private Map<String, Object> queryParams;
    private ConnectionEx connection;
    private ProxyEx proxy;
    private Logger logger;

    public ExecutionObj() {
    }

    public Map<String, Object> getQueryParams() {
        return queryParams;
    }

    public void setQueryParams(Map<String, Object> queryParams) {
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

    public Logger getLogger() {
        return logger;
    }

    public void setLogger(Logger logger) {
        this.logger = logger;
    }
}
