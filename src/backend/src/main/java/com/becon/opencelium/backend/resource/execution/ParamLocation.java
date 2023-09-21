package com.becon.opencelium.backend.resource.execution;

public enum ParamLocation {
    HEADER("header"),
    QUERY("query"),
    PATH("path"),
    COOKIES("cookies");

    private final String location;

    private ParamLocation(String location) {
        this.location = location;
    }

    public String getLocation() {
        return location;
    }
}
