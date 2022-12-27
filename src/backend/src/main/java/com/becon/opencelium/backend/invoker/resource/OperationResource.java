package com.becon.opencelium.backend.invoker.resource;

import jakarta.annotation.Resource;

import java.util.List;

@Resource
public class OperationResource {

    private String method;
    private String path;
    private List<FieldResource> fields;

    public OperationResource() {
    }

    public OperationResource(String path, List<FieldResource> fields) {
        this.path = path;
        this.fields = fields;
    }

    public String getMethod() {
        return method;
    }

    public void setMethod(String method) {
        this.method = method;
    }

    public String getPath() {
        return path;
    }

    public void setPath(String path) {
        this.path = path;
    }

    public List<FieldResource> getFields() {
        return fields;
    }

    public void setFields(List<FieldResource> fields) {
        this.fields = fields;
    }
}
