package com.becon.opencelium.backend.resource.update_assistant.migrate.neo4j;


public class ConnectorNode {
    private Long id;
    private Integer connectorId;
    private String name;
    private String webService; // web service type: soap or rest, etc.
    private MethodNode startMethod;
    private StatementNode startOperator;

    public ConnectorNode() {
    }

    public Long getId() {
        return id;
    }

    public void setId(Long id) {
        this.id = id;
    }

    public String getName() {
        return name;
    }

    public void setName(String name) {
        this.name = name;
    }

    public Integer getConnectorId() {
        return connectorId;
    }

    public void setConnectorId(Integer connectorId) {
        this.connectorId = connectorId;
    }

    public String getWebService() {
        return webService;
    }

    public void setWebService(String webService) {
        this.webService = webService;
    }

    public MethodNode getStartMethod() {
        return startMethod;
    }

    public void setStartMethod(MethodNode startMethod) {
        this.startMethod = startMethod;
    }

    public StatementNode getStartOperator() {
        return startOperator;
    }

    public void setStartOperator(StatementNode startOperator) {
        this.startOperator = startOperator;
    }
}
