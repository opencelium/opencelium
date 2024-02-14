package com.becon.opencelium.backend.invoker.enums;

public enum PageParam {
    SIZE("size"), OFFSET("offset"), LIMIT("limit"), RESULT("result"), ORDER("order"),
    SORT("sort"), CATEGORY("category"), NEXT("next"), PREV("prev");
    private final String param;
    PageParam(String param) {
        this.param = param;
    }

    @Override
    public String toString() {
        return param;
    }
}
