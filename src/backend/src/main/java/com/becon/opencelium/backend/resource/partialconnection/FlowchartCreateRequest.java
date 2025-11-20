package com.becon.opencelium.backend.resource.partialconnection;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;

public class FlowchartCreateRequest {

    @NotNull(message = "'connectionId' is required")
    private Long connectionId;

    @NotNull(message = "'connectorId' is required")
    private Integer connectorId;

    @NotBlank(message = "'title' is required")
    private String title;

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

    public String getTitle() {
        return title;
    }

    public void setTitle(String title) {
        this.title = title;
    }
}
