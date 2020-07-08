package com.becon.opencelium.backend.execution.test.entity;

import java.util.List;

public class TDependencies {
    private String color;
    private String name;
    private List<Object> value;

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

    public List getValue() {
        return value;
    }

    public void setValue(List value) {
        this.value = value;
    }
}
