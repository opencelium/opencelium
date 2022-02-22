package com.becon.opencelium.backend.invoker.resource;

import javax.annotation.Resource;

@Resource
public class FieldResource {
    private String name;
    private String type;
    private Object value;

    public FieldResource() {
    }

    public FieldResource(String name, String type, Object value) {
        this.name = name;
        this.type = type;
        this.value = value;
    }

    public String getName() {
        return name;
    }

    public void setName(String name) {
        this.name = name;
    }

    public String getType() {
        return type;
    }

    public void setType(String type) {
        this.type = type;
    }

    public Object getValue() {
        return value;
    }

    public void setValue(Object value) {
        this.value = value;
    }
}
