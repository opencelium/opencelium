package com.becon.opencelium.backend.resource.partialconnection;

import jakarta.validation.constraints.NotNull;

public class FlowchartCreateRequest {

    @NotNull(message = "'connectionId' is required")
    private Long connectionId;

    @NotNull(message = "'connectorId' is required")
    private Integer connectorId;

    public Long getConnectionId() {
        return connectionId;
    }

    public void setConnectionId(Long connectionId) {
        this.connectionId = connectionId;
    }

    public Integer getConnectorId() {
        return connectorId;
    }

    public void setConnectorId(Integer connectorId) {
        this.connectorId = connectorId;
    }
}
