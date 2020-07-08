package com.becon.opencelium.backend.execution.test.entity;

import java.util.List;

public class TConnector {

    private String name;
    private List<TMethod> methods;

    public String getName() {
        return name;
    }

    public void setName(String name) {
        this.name = name;
    }

    public List<TMethod> getMethods() {
        return methods;
    }

    public void setMethods(List<TMethod> methods) {
        this.methods = methods;
    }
}
