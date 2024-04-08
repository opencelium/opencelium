package com.becon.opencelium.backend.resource.update_assistant.migrate.neo4j;

import java.util.List;

public class EnhancementNode {

    private Long id;

    private Integer enhanceId; // TODO: need to change in db from int to bigint
    private String name;

    private List<FieldNode> incomeField;

    private List<FieldNode> outgoingField;

    public EnhancementNode() {

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

    public Integer getEnhanceId() {
        return enhanceId;
    }

    public void setEnhanceId(Integer enhanceId) {
        this.enhanceId = enhanceId;
    }

    public List<FieldNode> getIncomeField() {
        return incomeField;
    }

    public void setIncomeField(List<FieldNode> incomeField) {
        this.incomeField = incomeField;
    }

    public List<FieldNode> getOutgoingField() {
        return outgoingField;
    }

    public void setOutgoingField(List<FieldNode> outgoingField) {
        this.outgoingField = outgoingField;
    }
}
