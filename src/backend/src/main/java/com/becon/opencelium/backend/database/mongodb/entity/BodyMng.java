package com.becon.opencelium.backend.database.mongodb.entity;

import com.becon.opencelium.backend.invoker.entity.Body;
import org.springframework.data.annotation.Id;
import org.springframework.data.mongodb.core.mapping.Document;

import java.util.Map;

@Document(collection = "body")
public class BodyMng {
    @Id
    private String id;
    private String type;
    private String format;
    private String data;
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

    public String getId() {
        return id;
    }

    public void setId(String id) {
        this.id = id;
    }
}
