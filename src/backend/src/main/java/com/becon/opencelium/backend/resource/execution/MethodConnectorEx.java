package com.becon.opencelium.backend.resource.execution;

import com.becon.opencelium.backend.invoker.entity.Pagination;

import java.util.Map;

/**
 * Connector metadata attached to an individual method in multi-connector mode.
 * <p>
 * In multi-connector connections each method references a connector by ID.
 * Instances of this class are resolved once in {@code buildObj} and stored in
 * {@link ConnectionEx#getConnectors()}, keyed by connector ID. The execution
 * engine looks up the appropriate entry when processing each method.
 * <p>
 * Not used in legacy (two-connector) connections — see {@link ConnectorEx} instead.
 */
public class MethodConnectorEx implements ExecutionConnector {

    private Integer id;

    private String title;

    private boolean sslCert;

    private int timeout;

    private String invoker;

    private Pagination pagination;

    private Map<String, String> requiredData;

    public String getTitle() {
        return title;
    }

    public void setTitle(String title) {
        this.title = title;
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

    public String getInvoker() {
        return invoker;
    }

    public void setInvoker(String invoker) {
        this.invoker = invoker;
    }

    public Map<String, String> getRequiredData() {
        return requiredData;
    }

    public void setRequiredData(Map<String, String> requiredData) {
        this.requiredData = requiredData;
    }

    public Integer getId() {
        return id;
    }

    public void setId(Integer id) {
        this.id = id;
    }

    public Pagination getPagination() {
        return pagination;
    }

    public void setPagination(Pagination pagination) {
        this.pagination = pagination;
    }
}
