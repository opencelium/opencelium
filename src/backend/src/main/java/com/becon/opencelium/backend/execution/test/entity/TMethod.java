package com.becon.opencelium.backend.execution.test.entity;

import java.util.List;

public class TMethod {

    private String name;
    private String color;
    private List<TFiled> fields;

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

    public List<TFiled> getFields() {
        return fields;
    }

    public void setFields(List<TFiled> fields) {
        this.fields = fields;
    }
}
