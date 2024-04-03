package com.becon.opencelium.backend.resource.update_assistant.migrate.neo4j;

public class StatementVariable {

    private Long id;

    private String color;
    private String type;
    private String filed;// if like then -> {}
    private String rightPropertyValue;

    public StatementVariable() {
    }

    public Long getId() {
        return id;
    }

    public void setId(Long id) {
        this.id = id;
    }

    public String getColor() {
        return color;
    }

    public void setColor(String color) {
        this.color = color;
    }

    public String getType() {
        return type;
    }

    public void setType(String type) {
        this.type = type;
    }

    public String getFiled() {
        return filed;
    }

    public void setFiled(String filed) {
        this.filed = filed;
    }

    public String getRightPropertyValue() {
        return rightPropertyValue;
    }

    public void setRightPropertyValue(String rightPropertyValue) {
        this.rightPropertyValue = rightPropertyValue;
    }
}
