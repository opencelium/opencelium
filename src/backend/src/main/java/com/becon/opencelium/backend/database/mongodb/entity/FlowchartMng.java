package com.becon.opencelium.backend.database.mongodb.entity;

import org.springframework.data.mongodb.core.mapping.DBRef;
import org.springframework.data.mongodb.core.mapping.Field;

import java.util.List;

public class FlowchartMng {

    @Field(name = "connector_id")
    private Integer connectorId;

    @Field(name = "flowId")
    private String flowId;

    private String title;

    @DBRef
    private List<MethodMng> methods;

    @DBRef
    private List<OperatorMng> operators;

    public Integer getConnectorId() {
        return connectorId;
    }

    public void setConnectorId(Integer connectorId) {
        this.connectorId = connectorId;
    }

    public String getFlowId() {
        return flowId;
    }

    public void setFlowId(String flowId) {
        this.flowId = flowId;
    }

    public String getTitle() {
        return title;
    }

    public void setTitle(String title) {
        this.title = title;
    }

    public List<MethodMng> getMethods() {
        return methods;
    }

    public void setMethods(List<MethodMng> methods) {
        this.methods = methods;
    }

    public List<OperatorMng> getOperators() {
        return operators;
    }

    public void setOperators(List<OperatorMng> operators) {
        this.operators = operators;
    }
}
