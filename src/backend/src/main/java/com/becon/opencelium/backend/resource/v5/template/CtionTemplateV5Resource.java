package com.becon.opencelium.backend.resource.v5.template;

import com.becon.opencelium.backend.resource.v5.connection.ExecutionPlanDTO;

import java.util.List;
import java.util.Map;

public class CtionTemplateV5Resource {

    private String id;
    private Long connectionId;
    private String title;
    private String description;
    private List<FchartTemplateResource> flowcharts;
    private ExecutionPlanDTO executionPlan;
    private Object mappers;
    private Map<String, Object> ui;

    public String getId() {
        return id;
    }

    public void setId(String id) {
        this.id = id;
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

    public List<FchartTemplateResource> getFlowcharts() {
        return flowcharts;
    }

    public void setFlowcharts(List<FchartTemplateResource> flowcharts) {
        this.flowcharts = flowcharts;
    }

    public ExecutionPlanDTO getExecutionPlan() {
        return executionPlan;
    }

    public void setExecutionPlan(ExecutionPlanDTO executionPlan) {
        this.executionPlan = executionPlan;
    }

    public Object getMappers() {
        return mappers;
    }

    public void setMappers(Object mappers) {
        this.mappers = mappers;
    }

    public Map<String, Object> getUi() {
        return ui;
    }

    public void setUi(Map<String, Object> ui) {
        this.ui = ui;
    }
}
