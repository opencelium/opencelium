package com.becon.opencelium.backend.resource.connection.test;

import com.becon.opencelium.backend.execution.test.entity.TFiled;

import java.util.List;

public class RouteResource {

    private String color;
    private String method;
    private List<TFiled> TFileds;

    public String getColor() {
        return color;
    }

    public void setColor(String color) {
        this.color = color;
    }

    public String getMethod() {
        return method;
    }

    public void setMethod(String method) {
        this.method = method;
    }

    public List<TFiled> getTFileds() {
        return TFileds;
    }

    public void setTFileds(List<TFiled> TFileds) {
        this.TFileds = TFileds;
    }
}
