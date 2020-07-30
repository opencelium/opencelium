package com.becon.opencelium.backend.invoker.entity;

import com.becon.opencelium.backend.resource.connector.BodyResource;

import java.util.Map;

public class Body {
    private String type;
    private String format;
    private String data;
    private Map<String, Object> fields;

    public Body() {
    }

    public Body(BodyResource bodyResource) {
        this.type = bodyResource.getType();
        this.format = bodyResource.getFormat();
        this.data = bodyResource.getData();
        this.fields = bodyResource.getFields();
    }

    public String getType() {
        return type;
    }

    public void setType(String type) {
        this.type = type;
    }

    public String getFormat() {
        return format;
    }

    public void setFormat(String format) {
        this.format = format;
    }

    public String getData() {
        return data;
    }

    public void setData(String data) {
        this.data = data;
    }

    public Map<String, Object> getFields() {
        return fields;
    }

    public void setFields(Map<String, Object> fields) {
        this.fields = fields;
    }
}
