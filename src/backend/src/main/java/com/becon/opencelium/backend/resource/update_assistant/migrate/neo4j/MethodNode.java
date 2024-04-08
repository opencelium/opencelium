package com.becon.opencelium.backend.resource.update_assistant.migrate.neo4j;

public class MethodNode {

    private Long id;
    private String index;
    private String color;
    private String name;
    private String label;
    private Integer aggregatorId;
    private RequestNode requestNode;

    private ResponseNode responseNode;

    private MethodNode nextFunction;

    private StatementNode nextOperator;

    public Long getId() {
        return id;
    }

    public void setId(Long id) {
        this.id = id;
    }

    public String getIndex() {
        return index;
    }

    public void setIndex(String index) {
        this.index = index;
    }

    public String getColor() {
        return color;
    }

    public void setColor(String color) {
        this.color = color;
    }

    public String getName() {
        return name;
    }

    public void setName(String name) {
        this.name = name;
    }

    public RequestNode getRequestNode() {
        return requestNode;
    }

    public void setRequestNode(RequestNode requestNode) {
        this.requestNode = requestNode;
    }

    public ResponseNode getResponseNode() {
        return responseNode;
    }

    public void setResponseNode(ResponseNode responseNode) {
        this.responseNode = responseNode;
    }

    public MethodNode getNextFunction() {
        return nextFunction;
    }

    public void setNextFunction(MethodNode nextFunction) {
        this.nextFunction = nextFunction;
    }

    public StatementNode getNextOperator() {
        return nextOperator;
    }

    public void setNextOperator(StatementNode nextOperator) {
        this.nextOperator = nextOperator;
    }

    public String getLabel() {
        return label;
    }

    public void setLabel(String label) {
        this.label = label;
    }

    public Integer getAggregatorId() {
        return aggregatorId;
    }

    public void setAggregatorId(Integer aggregatorId) {
        this.aggregatorId = aggregatorId;
    }
}
