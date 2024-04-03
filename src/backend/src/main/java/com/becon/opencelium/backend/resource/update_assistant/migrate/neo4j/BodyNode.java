package com.becon.opencelium.backend.resource.update_assistant.migrate.neo4j;

import java.util.List;

public class BodyNode {
    private Long id;
    private String name = "body";
    private String type;
    private String format;
    private String data;
    private List<FieldNode> fields;

    public Long getId() {
        return id;
    }

    public void setId(Long id) {
        this.id = id;
    }

    public String getName() {
        return name;
    }

    public void setName(String name) {
        this.name = name;
    }

    public List<FieldNode> getFields() {
        return fields;
    }

    public void setFields(List<FieldNode> fields) {
        this.fields = fields;
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
}
