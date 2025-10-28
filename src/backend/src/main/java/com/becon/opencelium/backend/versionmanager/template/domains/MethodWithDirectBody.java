package com.becon.opencelium.backend.versionmanager.template.domains;

public class MethodWithDirectBody {
    private String nodeId;
    private String index;
    private String name;
    private String color;
    private String label;
    private Integer dataAggregator;
    private RequestWithDirectBody request;
    private ResponseWithDirectBody response;

    public String getNodeId() {
        return nodeId;
    }

    public void setNodeId(String nodeId) {
        this.nodeId = nodeId;
    }

    public String getIndex() {
        return index;
    }

    public void setIndex(String index) {
        this.index = index;
    }

    public String getName() {
        return name;
    }

    public void setName(String name) {
        this.name = name;
    }

    public String getColor() {
        return color;
    }

    public void setColor(String color) {
        this.color = color;
    }

    public String getLabel() {
        return label;
    }

    public void setLabel(String label) {
        this.label = label;
    }

    public RequestWithDirectBody getRequest() {
        return request;
    }

    public void setRequest(RequestWithDirectBody request) {
        this.request = request;
    }

    public ResponseWithDirectBody getResponse() {
        return response;
    }

    public void setResponse(ResponseWithDirectBody response) {
        this.response = response;
    }

    public Integer getDataAggregator() {
        return dataAggregator;
    }

    public void setDataAggregator(Integer dataAggregator) {
        this.dataAggregator = dataAggregator;
    }
}
