package com.becon.opencelium.backend.database.mongodb.entity;

import com.becon.opencelium.backend.invoker.entity.Body;

import java.util.Map;

public class BodyMng {
    private String type; // Object, Array, String, Number
    private String format; // json, xml, html, text
    private String data; // raw, binary, form-data, x-www-form-urlencoded, GraphQL
    private Map<String, Object> fields;

    public BodyMng() {
    }
    public BodyMng(Body body) {
        this.type = body.getType();
        this.format = body.getFormat();
        this.data = body.getData();
        this.fields = body.getFields();
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
