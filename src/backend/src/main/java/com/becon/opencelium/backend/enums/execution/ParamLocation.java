package com.becon.opencelium.backend.enums.execution;

public enum ParamLocation {
    HEADER("header"),
    QUERY("query"),
    PATH("path"),
    COOKIE("cookie");

    private final String location;

    private ParamLocation(String location) {
        this.location = location;
    }

    public String getLocation() {
        return location;
    }
}
