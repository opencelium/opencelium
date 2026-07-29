/*
 * // Copyright (C) <2020> <becon GmbH>
 * //
 * // This program is free software: you can redistribute it and/or modify
 * // it under the terms of the GNU General Public License as published by
 * // the Free Software Foundation, version 3 of the License.
 * //
 * // This program is distributed in the hope that it will be useful,
 * // but WITHOUT ANY WARRANTY; without even the implied warranty of
 * // MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE. See the
 * // GNU General Public License for more details.
 * //
 * // You should have received a copy of the GNU General Public License
 * // along with this program. If not, see <http://www.gnu.org/licenses/>.
 */

package com.becon.opencelium.backend.resource.connector;

import com.becon.opencelium.backend.enums.ConnectorStatus;
import com.fasterxml.jackson.annotation.JsonInclude;
import jakarta.annotation.Resource;

import java.util.Map;

@Resource
@JsonInclude(JsonInclude.Include.NON_NULL)
public class ConnectorResource {

    private int connectorId;
    private String title;
    private String description;
    private String icon;
    private InvokerDTO invoker;
    private boolean sslCert;
    private int timeout;
    private Map<String, String> requestData;
    // Health status determined by the most recent communication check.
    private ConnectorStatus status;
    // Remote error message from the last failed test.
    private String lastTestError;
    // Epoch millis of the most recent health check; null = never checked.
    private Long lastCheckedAt;

    public int getConnectorId() {
        return connectorId;
    }

    public void setConnectorId(int connectorId) {
        this.connectorId = connectorId;
    }

    public String getTitle() {
        return title;
    }

    public void setTitle(String title) {
        this.title = title;
    }

    public String getDescription() {
        return description;
    }

    public void setDescription(String description) {
        this.description = description;
    }

    public String getIcon() {
        return icon;
    }

    public void setIcon(String icon) {
        this.icon = icon;
    }

    public InvokerDTO getInvoker() {
        return invoker;
    }

    public void setInvoker(InvokerDTO invoker) {
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

    public Map<String, String> getRequestData() {
        return requestData;
    }

    public void setRequestData(Map<String, String> requestData) {
        this.requestData = requestData;
    }

    public ConnectorStatus getStatus() {
        return status;
    }

    public void setStatus(ConnectorStatus status) {
        this.status = status;
    }

    public Long getLastCheckedAt() {
        return lastCheckedAt;
    }

    public void setLastCheckedAt(Long lastCheckedAt) {
        this.lastCheckedAt = lastCheckedAt;
    }

    public String getLastTestError() {
        return lastTestError;
    }

    public void setLastTestError(String lastTestError) {
        this.lastTestError = lastTestError;
    }
}
