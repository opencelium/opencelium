package com.becon.opencelium.backend.resource.connection.v5;

import java.util.List;
import java.util.Map;

public class ConnectionV5DTO {
    private String id;
    private Long connectionId;
    private String title;
    private String description;
    private String icon;
    private List<FlowchartDTO> flowcharts;
    private ExecutionPlanDTO executionPlan;
    private List<MapperDTO> mappers;
    private Integer categoryId;
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

    public String getIcon() {
        return icon;
    }

    public void setIcon(String icon) {
        this.icon = icon;
    }

    public List<MapperDTO> getMappers() {
        return mappers;
    }

    public void setMappers(List<MapperDTO> mappers) {
        this.mappers = mappers;
    }

    public Integer getCategoryId() {
        return categoryId;
    }

    public void setCategoryId(Integer categoryId) {
        this.categoryId = categoryId;
    }

    public Map<String, Object> getUi() {
        return ui;
    }

    public void setUi(Map<String, Object> ui) {
        this.ui = ui;
    }

    public List<FlowchartDTO> getFlowcharts() {
        return flowcharts;
    }

    public void setFlowcharts(List<FlowchartDTO> flowcharts) {
        this.flowcharts = flowcharts;
    }

    public ExecutionPlanDTO getExecutionPlan() {
        return executionPlan;
    }

    public void setExecutionPlan(ExecutionPlanDTO executionPlan) {
        this.executionPlan = executionPlan;
    }
}
