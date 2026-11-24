package com.becon.opencelium.backend.resource.execution;

import com.becon.opencelium.backend.execution.globalvariable.GlobalVariableSnapshot;
import com.becon.opencelium.backend.execution.globalvariable.GlobalVariableWriter;

import java.util.Map;
import java.util.Objects;

public class ExecutionObj {
    private Map<String, Object> webhookVars;
    private ConnectionEx connection;
    private ProxyEx proxy;
    // the global variables the run reads, as they were when the run was built
    private GlobalVariableSnapshot globalSnapshot = GlobalVariableSnapshot.empty();
    // writes the mutable variables of this run; null for a run that may write none
    private GlobalVariableWriter.Run globalWriter;

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

    public GlobalVariableWriter.Run getGlobalWriter() {
        return globalWriter;
    }

    public void setGlobalWriter(GlobalVariableWriter.Run globalWriter) {
        this.globalWriter = globalWriter;
    }

    public GlobalVariableSnapshot getGlobalSnapshot() {
        return globalSnapshot;
    }

    public void setGlobalSnapshot(GlobalVariableSnapshot globalSnapshot) {
        this.globalSnapshot = Objects.requireNonNull(globalSnapshot, "globalSnapshot");
    }
}
