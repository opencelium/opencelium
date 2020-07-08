package com.becon.opencelium.backend.execution.test.entity;


import java.util.List;

public class TFiled {

    private String name;
    private List<Object> value;
    private List<TDependencies> dependencies;

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
