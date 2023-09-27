package com.becon.opencelium.backend.resource.execution;

public enum ParamStyle {
    MATRIX("matrix"),
    TABLE("table"),
    FORM("form"),
    SIMPLE("simple"),
    SPACE_DELIMITED("space_delimited"),
    PIPE_DELIMITED("pipe_delimited"),
    DEEP_OBJECT("deep_object");

    private final String style;

    private ParamStyle(String style) {
        this.style = style;
    }

    public String getStyle() {
        return style;
    }
}
