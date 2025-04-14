package com.becon.opencelium.backend.resource.execution;

import java.util.Map;

public class ExecutionObj {
    private Map<String, Object> webhookVars;
    private ConnectionEx connection;
    private ProxyEx proxy;
    private LoggerConfiguration loggerConfiguration;

    public ExecutionObj() {
    }

    public Map<String, Object> getWebhookVars() {
        return webhookVars;
    }

    public void setWebhookVars(Map<String, Object> webhookVars) {
        this.webhookVars = webhookVars;
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

    public LoggerConfiguration getLoggerConfiguration() {
        return loggerConfiguration;
    }

    public void setLoggerConfiguration(LoggerConfiguration loggerConfiguration) {
        this.loggerConfiguration = loggerConfiguration;
    }
}
