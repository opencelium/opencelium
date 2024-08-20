package com.becon.opencelium.backend.enums.execution;

public enum ParamStyle {
    MATRIX("matrix"),
    LABEL("label"),
    FORM("form"),
    SIMPLE("simple"),
    SPACE_DELIMITED("spaceDelimited"),
    PIPE_DELIMITED("pipeDelimited"),
    DEEP_OBJECT("deepObject");

    private final String style;

    private ParamStyle(String style) {
        this.style = style;
    }

    public String getStyle() {
        return style;
    }
}
