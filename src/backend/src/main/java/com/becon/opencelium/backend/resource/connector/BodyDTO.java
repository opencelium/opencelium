package com.becon.opencelium.backend.resource.connector;

import com.becon.opencelium.backend.invoker.entity.Body;

import java.util.Map;

public class BodyDTO {

    private String type;
    private String format;
    private String data;
    private Map<String, Object> fields;

    public BodyDTO() {
    }

    public BodyDTO(Body body) {
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
