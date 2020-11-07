package com.becon.opencelium.backend.resource.template;

import com.becon.opencelium.backend.resource.connection.ConnectorNodeResource;
import com.fasterxml.jackson.annotation.JsonIgnoreProperties;

@JsonIgnoreProperties(ignoreUnknown = true)
public class CtionTemplateResource {

    private Long nodeId;
    private Long connectionId;
    private String title;
    private String description;
    private CtorTemplateResource fromConnector;
    private CtorTemplateResource toConnector;

    public Long getNodeId() {
        return nodeId;
    }

    public void setNodeId(Long nodeId) {
        this.nodeId = nodeId;
    }

    public Long getConnectionId() {
        return connectionId;
    }

    public void setConnectionId(Long connectionId) {
        this.connectionId = connectionId;
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

    public CtorTemplateResource getFromConnector() {
        return fromConnector;
    }

    public void setFromConnector(CtorTemplateResource fromConnector) {
        this.fromConnector = fromConnector;
    }

    public CtorTemplateResource getToConnector() {
        return toConnector;
    }

    public void setToConnector(CtorTemplateResource toConnector) {
        this.toConnector = toConnector;
    }
}
